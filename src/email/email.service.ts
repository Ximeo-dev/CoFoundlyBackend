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
import { safeCompare } from 'src/utils/safe-compare'
import * as zxcvbn from 'zxcvbn'

interface TokenPayload {
	id: string
	email: string
}

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
			port: configService.getOrThrow<number>('EMAIL_PORT'),
			secure: configService.getOrThrow<boolean>('EMAIL_SECURE'),
			auth: {
				user: this.emailUser,
				pass: configService.getOrThrow<string>('EMAIL_PASS'),
			},
			// logger: true,
		} as SMTPTransport.Options)
	}

	async sendMail(to: string, subject: string, html: string) {
		try {
			await this.transporter.sendMail({
				from: `"${this.emailUsername}" ${this.emailUser}`,
				to,
				subject,
				html,
			})
		} catch (err) {
			console.error('Error sending email:', err)
		}
	}

	private generateToken(): string {
		return randomBytes(32).toString('hex')
	}

	private actionEmailKey(userId: string, action: TwoFactorAction) {
		return `email:${action}:${userId}`
	}

	async issueToken(userId: string, action: TwoFactorAction) {
		const user = await this.userService.getByIdWithSecuritySettings(userId)

		if (!hasSecuritySettings(user))
			throw new NotFoundException('User not found')

		const key = this.actionEmailKey(userId, action)
		const ttl = TTL_BY_ACTION[action] ?? 60
		const token = this.generateToken()

		await this.redis.set(key, token, ttl)

		return token
	}

	async getPayloadFromToken(token: string) {
		try {
			const payload: TokenPayload = await this.jwt.verifyAsync(token)

			return payload
		} catch (error) {
			if (error.name === 'TokenExpiredError') {
				throw new BadRequestException('JWT Token Expired')
			} else {
				throw new BadRequestException('Invalid token')
			}
		}
	}

	async handleEmailConfirmationToken(token: string) {
		const payload = await this.getPayloadFromToken(token)
		const user = await this.userService.getByIdWithSecuritySettings(payload.id)

		if (!user || !user.securitySettings)
			throw new BadRequestException('Пользователь не найден')

		const { securitySettings } = user

		if (!safeCompare(securitySettings.emailConfirmationToken, token)) {
			await this.sendEmailConfirmation(payload.id)
			throw new BadRequestException(
				'Срок действия ссылки подтверждения истёк. Запрос на подтверждение был отправлен заново',
			)
		}

		return payload
	}

	async handleResetPasswordConfirmationToken(
		token: string,
		payload: TokenPayload,
	) {
		const user = await this.userService.getByIdWithSecuritySettings(payload.id)

		if (!user || !user.securitySettings)
			throw new BadRequestException('Пользователь не найден')

		const { securitySettings } = user

		if (!safeCompare(securitySettings.resetPasswordToken, token)) {
			throw new BadRequestException(
				'Срок действия ссылки подтверждения истёк. Запросите сброс пароля заново',
			)
		}
	}

	async handleChangeEmailConfirmationToken(token: string) {
		const payload = await this.getPayloadFromToken(token)
		const user = await this.userService.getByIdWithSecuritySettings(payload.id)

		if (!user || !user.securitySettings)
			throw new BadRequestException('Пользователь не найден')

		const { securitySettings } = user

		if (!safeCompare(securitySettings.changeEmailToken, token)) {
			throw new BadRequestException(
				'Срок действия ссылки подтверждения истёк. Запросите смену почты заново',
			)
		}

		return payload
	}

	async issueConfirmationToken(userId: string, email: string) {
		const data = { id: userId, email }

		return this.jwt.sign(data, {
			expiresIn: '10m',
		})
	}

	async sendEmailConfirmation(userId: string) {
		const user = await this.userService.getByIdWithSecuritySettings(userId)

		if (!user || !user.securitySettings) return

		const { securitySettings } = user

		if (securitySettings.isEmailConfirmed) {
			throw new EmailAlreadyConfirmedException()
		}

		const token = await this.issueConfirmationToken(user.id, user.email)

		await this.userService.setEmailConfirmationToken(user.id, token)

		const confirmationUrl = `http://${getEnvVar('API_URL')}/confirm-email?token=${token}`

		const context = {
			confirmationUrl,
		}

		const template = await getHtmlTemplate(
			getEnvVar('EMAIL_CONFIRMATION_MESSAGE_FILE'),
		)

		if (!template)
			throw new InternalServerErrorException(
				'Произошла ошибка во время отправки подтверждения',
			)

		this.transporter
			.sendMail({
				from: `"CoFoundly" <${getEnvVar('EMAIL_USER')}>`,
				to: user.email,
				subject: 'Подтверждение эл. почты',
				html: compile(template)(context),
			})
			.catch((e) => console.log(e))
	}

	async confirmEmail(userId: string) {
		const user = await this.userService.getByIdWithSecuritySettings(userId)

		if (!user || !user.securitySettings) {
			throw new NotFoundException('Пользователь не найден')
		}

		const { securitySettings } = user

		if (securitySettings.isEmailConfirmed) {
			throw new EmailAlreadyConfirmedException()
		}

		await this.userService.setConfirmedEmailStatus(user.id, true)
	}

	async sendEmailResetPassword(email: string) {
		const user = await this.userService.getByEmail(email)

		if (!user) throw new BadRequestException('Пользователь не найден')

		const token = await this.issueConfirmationToken(user.id, user.email)

		await this.userService.setResetPasswordToken(user.id, token)

		const confirmationUrl = `http://${getEnvVar('FRONTEND_URL')}/reset-password/confirm?token=${token}`

		const context = {
			email: user.email,
			confirmationUrl,
		}

		const template = await getHtmlTemplate(
			getEnvVar('RESET_PASSWORD_CONFIRMATION_MESSAGE_FILE'),
		)

		if (!template)
			throw new InternalServerErrorException(
				'Произошла ошибка во время отправки подтверждения',
			)

		this.transporter
			.sendMail({
				from: `"CoFoundly" <${getEnvVar('EMAIL_USER')}>`,
				to: user.email,
				subject: 'Подтверждение восстановления пароля',
				html: compile(template)(context),
			})
			.catch((e) => console.log(e))
	}

	async confirmResetPassword(userId: string, dto: ResetPasswordConfirmDto) {
		const user = await this.userService.getById(userId)

		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}

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

		const { securitySettings } = user

		const isMatch = await verify(
			securitySettings.passwordHash,
			dto.currentPassword,
		)

		if (!isMatch) throw new BadRequestException('Неверный пароль')

		if (user.email === dto.newEmail)
			throw new BadRequestException('Аккаунт уже привязан к этому адресу почты')

		const token = await this.issueConfirmationToken(user.id, dto.newEmail)

		await this.userService.setChangeEmailToken(user.id, token)

		const confirmationUrl = `http://${getEnvVar('API_URL')}/confirm-change-email?token=${token}`

		const context = {
			oldEmail: user.email,
			newEmail: dto.newEmail,
			confirmationUrl,
		}

		const template = await getHtmlTemplate(
			getEnvVar('CHANGE_EMAIL_CONFIRMATION_MESSAGE_FILE'),
		)

		if (!template)
			throw new InternalServerErrorException(
				'Произошла ошибка во время отправки подтверждения',
			)

		this.transporter
			.sendMail({
				from: `"CoFoundly" <${getEnvVar('EMAIL_USER')}>`,
				to: dto.newEmail,
				subject: 'Подтверждение смены эл. почты',
				html: compile(template)(context),
			})
			.catch((e) => console.log(e))
	}

	async confirmChangeEmail(userId: string, newEmail: string) {
		const user = await this.userService.getById(userId)

		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}

		await this.userService.changeEmail(user.id, newEmail)
		await this.userService.setConfirmedEmailStatus(user.id, true)
	}
}
