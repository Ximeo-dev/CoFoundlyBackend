import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { JwtService, TokenExpiredError } from '@nestjs/jwt'
import { verify } from 'argon2'
import * as nodemailer from 'nodemailer'
import { ResetPasswordConfirmDto } from 'src/auth/dto/reset-password.dto'
import { EmailAlreadyConfirmedException } from 'src/exceptions/EmailAlreadyConfirmedException'
import { ChangeEmailDto } from 'src/user/dto/user.dto'
import { UserService } from 'src/user/user.service'
import { getEnvVar } from 'src/utils/env'
import { fillHtmlTemplate } from 'src/utils/fillHtmlTemplate'
import { getHtmlTemplate } from 'src/utils/getHtmlTemplate'

interface ITokenPayload {
	id: string
	email: string
}

@Injectable()
export class EmailService {
	private transporter = nodemailer.createTransport({
		host: getEnvVar('EMAIL_HOST'),
		port: 587,
		secure: false,
		auth: {
			user: getEnvVar('EMAIL_USER'),
			pass: getEnvVar('EMAIL_PASS'),
		},
		// logger: true,
	})

	constructor(
		private jwt: JwtService,
		private userService: UserService,
	) {}

	async getPayloadFromToken(token: string) {
		try {
			const payload: ITokenPayload = await this.jwt.verifyAsync(token)

			return payload
		} catch (error) {
			if (error.name === 'TokenExpiredError') {
				throw new BadRequestException('JWT Token Expired')
			} else {
				throw new BadRequestException('Invalid token')
			}
		}
	}

	async handleEmailConfirmationToken(token: string, payload: ITokenPayload) {
		const user = await this.userService.getByIdWithSecuritySettings(payload.id)

		if (!user || !user.securitySettings)
			throw new BadRequestException('Пользователь не найден')

		const { securitySettings } = user

		if (securitySettings.emailConfirmationToken !== token) {
			await this.sendEmailConfirmation(payload.id)
			throw new BadRequestException(
				'Срок действия ссылки подтверждения истёк. Запрос на подтверждение был отправлен заново',
			)
		}
	}

	async handleResetPasswordConfirmationToken(
		token: string,
		payload: ITokenPayload,
	) {
		const user = await this.userService.getByIdWithSecuritySettings(payload.id)

		if (!user || !user.securitySettings)
			throw new BadRequestException('Пользователь не найден')

		const { securitySettings } = user

		if (securitySettings.resetPasswordToken !== token) {
			throw new BadRequestException(
				'Срок действия ссылки подтверждения истёк. Запросите сброс пароля заново',
			)
		}
	}

	async issueConfirmationToken(userId: string, email: string) {
		const data = { id: userId, email }

		return this.jwt.sign(data, {
			expiresIn: '10m',
		})
	}

	async sendEmailConfirmation(userId: string) {
		const user = await this.userService.getByIdWithSecuritySettings(userId)

		if (!user || !user.securitySettings)
			throw new BadRequestException('Пользователь не найден')

		const { securitySettings } = user

		if (securitySettings.isEmailConfirmed) {
			throw new EmailAlreadyConfirmedException()
		}

		const token = await this.issueConfirmationToken(user.id, user.email)

		await this.userService.setEmailConfirmationToken(user.id, token)

		const confirmationUrl = `http://${getEnvVar('API')}/confirm-email?token=${token}`

		const variables = {
			name: user.name,
			confirmationUrl,
		}

		const template = await getHtmlTemplate('email-confirm')

		if (!template) return

		this.transporter
			.sendMail({
				from: `"CoFoundly" <${getEnvVar('EMAIL_USER')}>`,
				to: user.email,
				subject: 'Подтверждение эл. почты',
				html: fillHtmlTemplate(template, variables),
			})
			.catch((e) => console.log(e))
	}

	async confirmEmail(userId: string) {
		const user = await this.userService.getByEmailWithSecuritySettings(userId)

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

		const confirmationUrl = `http://${getEnvVar('FRONTEND')}/reset-password/confirm?token=${token}`

		const variables = {
			email: user.email,
			confirmationUrl,
		}

		const template = await getHtmlTemplate('reset-password')

		if (!template) return

		this.transporter
			.sendMail({
				from: `"CoFoundly" <${getEnvVar('EMAIL_USER')}>`,
				to: user.email,
				subject: 'Подтверждение восстановления пароля',
				html: fillHtmlTemplate(template, variables),
			})
			.catch((e) => console.log(e))
	}

	async confirmResetPassword(userId: string, dto: ResetPasswordConfirmDto) {
		const user = await this.userService.getById(userId)

		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}

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

		const confirmationUrl = `http://${getEnvVar('API')}/confirm-change-email?token=${token}`

		const variables = {
			oldEmail: user.email,
			newEmail: dto.newEmail,
			confirmationUrl,
		}

		const template = await getHtmlTemplate('change-email-confirm')

		if (!template) return

		this.transporter
			.sendMail({
				from: `"Infinitum" <${getEnvVar('EMAIL_USER')}>`,
				to: dto.newEmail,
				subject: 'Подтверждение смены эл. почты',
				html: fillHtmlTemplate(template, variables),
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
