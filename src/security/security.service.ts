import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { randomBytes } from 'crypto'
import { compile } from 'handlebars'
import { AuthService } from 'src/auth/auth.service'
import {
	MAIL_MESSAGES_FILE_PATHS,
	TTL_BY_SECURITY_ACTION,
} from 'src/constants/constants'
import { EmailAlreadyConfirmedException } from 'src/exceptions/EmailAlreadyConfirmedException'
import { MailService } from 'src/mail/mail.service'
import { RedisService } from 'src/redis/redis.service'
import {
	ChangeEmailDto,
	ResetPasswordConfirmDto,
} from 'src/security/dto/security.dto'
import { UserService } from 'src/user/user.service'
import { getEnvVar } from 'src/utils/env'
import { getHtmlTemplate } from 'src/utils/getHtmlTemplate'
import { safeCompare } from 'src/utils/safe-compare'
import * as zxcvbn from 'zxcvbn'
import { SecurityAction } from './types/security.types'

@Injectable()
export class SecurityService {
	constructor(
		private readonly userService: UserService,
		private readonly redis: RedisService,
		private readonly mailService: MailService,
		private readonly authService: AuthService,
	) {}

	public generateToken(): string {
		return randomBytes(32).toString('hex')
	}

	private actionEmailKey(userId: string, action: SecurityAction) {
		return `email:${action}:${userId}`
	}

	private changeEmailKey(token: string) {
		return `email:${SecurityAction.CHANGE_EMAIL}:token:${token}`
	}

	async issueActionEmailToken(userId: string, action: SecurityAction) {
		const user = await this.userService.getById(userId)
		if (!user) throw new NotFoundException('User not found')

		const token = this.generateToken()
		const ttl = TTL_BY_SECURITY_ACTION[action] || 300

		let key: string
		if (action === SecurityAction.CHANGE_EMAIL) {
			key = this.changeEmailKey(token)
		} else {
			key = this.actionEmailKey(userId, action)
		}

		await this.redis.set(key, token, ttl)
		return token
	}

	async issueChangeEmailToken(userId: string, newEmail: string) {
		const action = SecurityAction.CHANGE_EMAIL

		const user = await this.userService.getById(userId)
		if (!user) throw new NotFoundException('User not found')

		const ttl = TTL_BY_SECURITY_ACTION[action] || 300

		let token: string
		do {
			token = this.generateToken()
		} while (await this.redis.exists(this.changeEmailKey(token)))

		const key = this.changeEmailKey(token)

		await this.redis.set(key, newEmail, ttl)
		return token
	}

	async verifyChangeEmailToken(token: string): Promise<string | null> {
		const key = this.changeEmailKey(token)
		const newEmail = await this.redis.get(key)
		if (!newEmail) return null

		await this.redis.del(key)
		return newEmail
	}

	async verifyActionToken(
		userId: string,
		action: SecurityAction,
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

		const token = await this.issueActionEmailToken(
			userId,
			SecurityAction.CONFIRM_EMAIL,
		)
		const confirmationUrl = `http://${getEnvVar('API_URL')}/security/confirm-email?userId=${userId}&token=${token}`

		const context = { confirmationUrl }
		const template = await getHtmlTemplate(
			MAIL_MESSAGES_FILE_PATHS.EMAIL_CONFIRMATION,
		)
		if (!template)
			throw new InternalServerErrorException('Error loading email template')

		this.mailService.sendMail(
			user.email,
			'Подтверждение эл. почты',
			compile(template)(context),
		)
	}

	async confirmEmailWithToken(userId: string, token: string) {
		const user = await this.userService.getById(userId)
		if (!user) throw new NotFoundException('Пользователь не найден')

		const isValid = await this.verifyActionToken(
			userId,
			SecurityAction.CONFIRM_EMAIL,
			token,
		)
		if (!isValid) throw new BadRequestException('Invalid or expired token')
		await this.userService.setConfirmedEmailStatus(userId, true)
	}

	async sendEmailResetPassword(email: string) {
		const user = await this.userService.getByEmail(email)
		if (!user) throw new BadRequestException('Пользователь не найден')

		const token = await this.issueActionEmailToken(
			user.id,
			SecurityAction.RESET_PASSWORD,
		)
		const confirmationUrl = `http://${getEnvVar('FRONTEND_URL')}/reset-password?userId=${user.id}&token=${token}`

		const context = { email: user.email, confirmationUrl }
		const template = await getHtmlTemplate(
			MAIL_MESSAGES_FILE_PATHS.RESET_PASSWORD_CONFIRMATION,
		)
		if (!template)
			throw new InternalServerErrorException('Error loading email template')

		this.mailService.sendMail(
			user.email,
			'Подтверждение восстановления пароля',
			compile(template)(context),
		)
	}

	async confirmResetPassword(
		userId: string,
		dto: ResetPasswordConfirmDto,
		token: string,
	) {
		const user = await this.userService.getById(userId)
		if (!user) throw new NotFoundException('Пользователь не найден')

		const isValid = await this.verifyActionToken(
			userId,
			SecurityAction.RESET_PASSWORD,
			token,
		)
		if (!isValid) throw new BadRequestException('Invalid or expired token')

		const result = zxcvbn(dto.password)
		if (result.score <= 1)
			throw new BadRequestException('Пароль слишком простой')

		await this.userService.setPassword(user.id, dto.password)
		await this.userService.invalidateTokens(user.id)
	}

	async sendChangeEmailConfirmation(
		userId: string,
		currentEmail: string,
		dto: ChangeEmailDto,
	) {
		const { userData } = await this.authService.validateUser({
			email: currentEmail,
			password: dto.currentPassword,
		})

		if (userData.email === dto.newEmail)
			throw new BadRequestException('Аккаунт уже привязан к этому адресу почты')

		const emailUser = await this.userService.getByEmail(dto.newEmail)
		if (emailUser)
			throw new BadRequestException('Пользователь с таким email уже существует')

		const token = await this.issueChangeEmailToken(userId, dto.newEmail)
		const confirmationUrl = `http://${getEnvVar('API_URL')}/security/change-email/confirm?userId=${userId}&token=${token}`

		const context = {
			displayUsername: userData.displayUsername,
			newEmail: dto.newEmail,
			confirmationUrl,
		}
		const template = await getHtmlTemplate(
			MAIL_MESSAGES_FILE_PATHS.CHANGE_EMAIL_CONFIRMATION,
		)
		if (!template)
			throw new InternalServerErrorException('Error loading email template')

		this.mailService.sendMail(
			dto.newEmail,
			'Подтверждение смены эл. почты',
			compile(template)(context),
		)
	}

	async confirmChangeEmail(userId: string, token: string) {
		const user = await this.userService.getById(userId)
		if (!user) throw new NotFoundException('Пользователь не найден')

		const newEmail = await this.verifyChangeEmailToken(token)
		if (!newEmail) throw new BadRequestException('Invalid or expired token')
		await this.userService.changeEmail(userId, newEmail)
		await this.userService.setConfirmedEmailStatus(userId, true)

		const context = {
			displayUsername: user.displayUsername,
			newEmail,
		}

		const template = await getHtmlTemplate(
			MAIL_MESSAGES_FILE_PATHS.EMAIL_CHANGED_NOTIFICATION,
		)
		if (!template)
			throw new InternalServerErrorException('Error loading email template')

		this.mailService.sendMail(
			user.email,
			'Смена адреса эл. почты',
			compile(template)(context),
		)
	}
}
