import {
	Body,
	Controller,
	Get,
	HttpCode,
	ParseUUIDPipe,
	Post,
	Query,
	Res,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { Response } from 'express'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import {
	ChangeEmailDto,
	ResetPasswordConfirmDto,
	ResetPasswordRequestDto,
} from 'src/security/dto/security.dto'
import { getEnvVar } from 'src/utils/env'
import { SecurityService } from './security.service'

@Controller('security')
export class SecurityController {
	constructor(private readonly securityService: SecurityService) {}

	@HttpCode(200)
	@Post('send-confirmation')
	@Auth()
	async sendConfirmation(@CurrentUser('id') id: string) {
		await this.securityService.sendEmailConfirmation(id)
		return { message: 'Письмо с подтверждением отправлено' }
	}

	@HttpCode(200)
	@Get('confirm-email')
	async confirmEmail(
		@Query('userId', ParseUUIDPipe) userId: string,
		@Query('token') token: string,
		@Res({ passthrough: true }) res: Response,
	) {
		await this.securityService.confirmEmailWithToken(userId, token)
		return res.redirect(`http://${getEnvVar('FRONTEND_URL')}/profile`)
	}

	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Post('change-email')
	@Auth()
	async changeEmail(
		@CurrentUser('id') id: string,
		@CurrentUser('email') email: string,
		@Body() dto: ChangeEmailDto,
	) {
		await this.securityService.sendChangeEmailConfirmation(id, email, dto)
		return { message: 'Письмо с подтверждением отправлено' }
	}

	@HttpCode(200)
	@Get('change-email/confirm')
	async confirmChangeEmail(
		@Query('userId', ParseUUIDPipe) userId: string,
		@Query('token') token: string,
		@Res({ passthrough: true }) res: Response,
	) {
		await this.securityService.confirmChangeEmail(userId, token)
		return res.redirect(`http://${getEnvVar('FRONTEND_URL')}/profile`)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('reset-password')
	async resetPasswordRequest(@Body() dto: ResetPasswordRequestDto) {
		await this.securityService.sendEmailResetPassword(dto.email)
		return { message: 'Письмо с подтверждением отправлено' }
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('reset-password/confirm')
	async confirmResetPassword(
		@Query('userId') userId: string,
		@Query('token') token: string,
		@Body() dto: ResetPasswordConfirmDto,
	) {
		await this.securityService.confirmResetPassword(userId, dto, token)
		return { message: 'Password reset successfully' }
	}
}
