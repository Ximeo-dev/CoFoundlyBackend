import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { verify } from 'argon2'
import { randomBytes } from 'crypto'
import { compile } from 'handlebars'
import * as nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import { ResetPasswordConfirmDto } from 'src/auth/dto/reset-password.dto'
import { TTL_BY_ACTION } from 'src/constants/constants'
import { EmailAlreadyConfirmedException } from 'src/exceptions/EmailAlreadyConfirmedException'
import { RedisService } from 'src/redis/redis.service'
import { TwoFactorAction } from 'src/two-factor/types/two-factor.types'
import { ChangeEmailDto } from 'src/user/dto/user.dto'
import { hasSecuritySettings } from 'src/user/types/user.guards'
import { UserService } from 'src/user/user.service'
import { getEnvVar } from 'src/utils/env'
import { getHtmlTemplate } from 'src/utils/getHtmlTemplate'
import { parseBool } from 'src/utils/parse-bool'
import { safeCompare } from 'src/utils/safe-compare'
import * as zxcvbn from 'zxcvbn'

@Injectable()
export class EmailService {
	private transporter: nodemailer.Transporter
	private emailUsername = 'CoFoundly'
	private emailUser: string

	constructor(
		private readonly configService: ConfigService,
		private readonly jwt: JwtService,
		private readonly userService: UserService,
		private readonly redis: RedisService,
	) {
		this.emailUser = configService.getOrThrow<string>('EMAIL_USER')
		this.transporter = nodemailer.createTransport({
			host: configService.getOrThrow<string>('EMAIL_HOST'),
			port: parseInt(configService.getOrThrow('EMAIL_PORT')),
			secure: parseBool(configService.getOrThrow('EMAIL_SECURE')),
			auth: {
				user: this.emailUser,
				pass: configService.getOrThrow<string>('EMAIL_PASS'),
			},
		} as SMTPTransport.Options)
	}

	async sendMail(to: string, subject: string, html: string) {
		await this.transporter.sendMail({
			from: `"${this.emailUsername}" <${this.emailUser}>`,
			to,
			subject,
			html,
		})
	}

	private generateToken(): string {
		return randomBytes(32).toString('hex')
	}

	private actionEmailKey(userId: string, action: string) {
		return `email:${action}:${userId}`
	}

	async issueToken(userId: string, action: TwoFactorAction) {
		const user = await this.userService.getById(userId)
		if (!user) throw new NotFoundException('User not found')

		const key = this.actionEmailKey(userId, action)
		const ttl = TTL_BY_ACTION[action] || 600
		const token = this.generateToken()

		await this.redis.set(key, token, ttl)
		return token
	}

	async verifyToken(
		userId: string,
		action: TwoFactorAction,
		token: string,
	): Promise<boolean> {
		const key = this.actionEmailKey(userId, action)
		const storedToken = await this.redis.get(key)
		if (!storedToken) return false
		const isValid = safeCompare(storedToken, token)
		if (isValid) {
			await this.redis.del(key)
		}
		return isValid
	}

	async sendEmailConfirmation(userId: string) {
		const user = await this.userService.getByIdWithSecuritySettings(userId)
		if (!user || !user.securitySettings) return

		if (user.securitySettings.isEmailConfirmed) {
			throw new EmailAlreadyConfirmedException()
		}

		const token = await this.issueToken(userId, TwoFactorAction.CONFIRM_EMAIL)
		const confirmationUrl = `http://${getEnvVar('API_URL')}/confirm-email?userId=${userId}&token=${token}`

		const context = { confirmationUrl }
		const template = await getHtmlTemplate(
			getEnvVar('EMAIL_CONFIRMATION_MESSAGE_FILE'),
		)
		if (!template)
			throw new InternalServerErrorException('Error loading email template')

		this.sendMail(
			user.email,
			'Подтверждение эл. почты',
			compile(template)(context),
		)
	}

	async confirmEmailWithToken(userId: string, token: string) {
		const isValid = await this.verifyToken(
			userId,
			TwoFactorAction.CONFIRM_EMAIL,
			token,
		)
		if (!isValid) throw new BadRequestException('Invalid or expired token')
		await this.userService.setConfirmedEmailStatus(userId, true)
	}

	async sendEmailResetPassword(email: string) {
		const user = await this.userService.getByEmail(email)
		if (!user) throw new BadRequestException('Пользователь не найден')

		const token = await this.issueToken(user.id, TwoFactorAction.RESET_PASSWORD)
		const confirmationUrl = `http://${getEnvVar('FRONTEND_URL')}/reset-password?userId=${user.id}&token=${token}`

		const context = { email: user.email, confirmationUrl }
		const template = await getHtmlTemplate(
			getEnvVar('RESET_PASSWORD_CONFIRMATION_MESSAGE_FILE'),
		)
		if (!template)
			throw new InternalServerErrorException('Error loading email template')

		this.sendMail(
			user.email,
			'Подтверждение восстановления пароля',
			compile(template)(context),
		)
	}

	async verifyResetPasswordToken(userId: string, token: string) {
		const isValid = await this.verifyToken(
			userId,
			TwoFactorAction.RESET_PASSWORD,
			token,
		)
		if (!isValid) throw new BadRequestException('Invalid or expired token')
	}

	async confirmResetPassword(userId: string, dto: ResetPasswordConfirmDto) {
		const user = await this.userService.getById(userId)
		if (!user) throw new NotFoundException('Пользователь не найден')

		const result = zxcvbn(dto.password)
		if (result.score <= 1)
			throw new BadRequestException('Пароль слишком простой')

		await this.userService.setPassword(user.id, dto.password)
		await this.userService.invalidateTokens(user.id)
	}

	async sendChangeEmailConfirmation(userId: string, dto: ChangeEmailDto) {
		const user = await this.userService.getByIdWithSecuritySettings(userId)
		if (!user || !user.securitySettings)
			throw new BadRequestException('Пользователь не найден')

		const isMatch = await verify(
			user.securitySettings.passwordHash,
			dto.currentPassword,
		)
		if (!isMatch) throw new BadRequestException('Неверный пароль')

		if (user.email === dto.newEmail)
			throw new BadRequestException('Аккаунт уже привязан к этому адресу почты')

		const token = await this.issueToken(userId, TwoFactorAction.CHANGE_EMAIL)
		const confirmationUrl = `http://${getEnvVar('API_URL')}/confirm-change-email?userId=${userId}&token=${token}&newEmail=${encodeURIComponent(dto.newEmail)}`

		const context = {
			oldEmail: user.email,
			newEmail: dto.newEmail,
			confirmationUrl,
		}
		const template = await getHtmlTemplate(
			getEnvVar('CHANGE_EMAIL_CONFIRMATION_MESSAGE_FILE'),
		)
		if (!template)
			throw new InternalServerErrorException('Error loading email template')

		this.sendMail(
			dto.newEmail,
			'Подтверждение смены эл. почты',
			compile(template)(context),
		)
	}

	async confirmChangeEmailWithToken(
		userId: string,
		token: string,
		newEmail: string,
	) {
		const isValid = await this.verifyToken(
			userId,
			TwoFactorAction.CHANGE_EMAIL,
			token,
		)
		if (!isValid) throw new BadRequestException('Invalid or expired token')
		await this.userService.changeEmail(userId, newEmail)
		await this.userService.setConfirmedEmailStatus(userId, true)
	}
}
