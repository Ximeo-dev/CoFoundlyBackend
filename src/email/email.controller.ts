import { Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { getEnvVar } from 'src/utils/env'
import { EmailService } from './email.service'

@Controller()
export class EmailController {
	constructor(private readonly emailService: EmailService) {}

	@HttpCode(200)
	@Get('confirm-email')
	async confirmEmail(
		@Query('token') token: string,
		@Res({ passthrough: true }) res: Response,
	) {
		const payload = await this.emailService.handleEmailConfirmationToken(token)
		await this.emailService.confirmEmail(payload.id)
		return res.redirect(`http://${getEnvVar('FRONTEND_URL')}/profile`)
	}

	@HttpCode(200)
	@Get('confirm-change-email')
	async confirmChangeEmail(
		@Query('token') token: string,
		@Res({ passthrough: true }) res: Response,
	) {
		const payload =
			await this.emailService.handleChangeEmailConfirmationToken(token)
		await this.emailService.confirmChangeEmail(payload.id, payload.email)
		return res.redirect(`http://${getEnvVar('')}/profile`)
	}

	@HttpCode(200)
	@Post('send-confirmation')
	@Auth()
	async sendConfirmation(@CurrentUser('id') id: string) {
		await this.emailService.sendEmailConfirmation(id)

		return { message: 'Письмо с подтверждением отправлено' }
	}
}
