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
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
} from '@nestjs/swagger'
import { FRONTEND_REDIRECT_LINK } from 'src/constants/constants'
import { Throttle } from '@nestjs/throttler'
import { Confirmed } from './decorators/confirmed.decorator'

@Controller('security')
export class SecurityController {
	constructor(private readonly securityService: SecurityService) {}

	@ApiOperation({ summary: 'Send email confirmation message' })
	@ApiBearerAuth()
	@ApiOkResponse({
		schema: {
			type: 'object',
			properties: {
				message: {
					type: 'string',
					example: 'Письмо с подтверждением отправлено',
				},
			},
		},
	})
	@ApiBadRequestResponse({ description: 'Email already confirmed' })
	@HttpCode(200)
	@Post('send-confirmation')
	@Auth()
	async sendConfirmation(@CurrentUser('id') id: string) {
		await this.securityService.sendEmailConfirmation(id)
		return { message: 'Письмо с подтверждением отправлено' }
	}

	@ApiOperation({
		summary: 'Email confirm',
		description: 'Handles confirmation link from mail',
	})
	@ApiOkResponse({ description: 'Should redirect to profile' })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiBadRequestResponse({ description: 'Invalid or expired token' })
	@HttpCode(200)
	@Get('confirm-email')
	async confirmEmail(
		@Query('userId', ParseUUIDPipe) userId: string,
		@Query('token') token: string,
		@Res({ passthrough: true }) res: Response,
	) {
		await this.securityService.confirmEmailWithToken(userId, token)
		return res.redirect(FRONTEND_REDIRECT_LINK)
	}

	@ApiOperation({ summary: 'Send change email confirmation message' })
	@ApiBearerAuth()
	@ApiOkResponse({
		schema: {
			type: 'object',
			properties: {
				message: {
					type: 'string',
					example: 'Письмо с подтверждением отправлено',
				},
			},
		},
	})
	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Post('change-email')
	@Throttle({ default: { limit: 2, ttl: 10000 } })
	@Confirmed()
	@Auth()
	async changeEmail(
		@CurrentUser('id') id: string,
		@CurrentUser('email') email: string,
		@Body() dto: ChangeEmailDto,
	) {
		await this.securityService.sendChangeEmailConfirmation(id, email, dto)
		return { message: 'Письмо с подтверждением отправлено' }
	}

	@ApiOperation({
		summary: 'Change email confirm',
		description: 'Handles change email confirmation link from mail',
	})
	@ApiOkResponse({ description: 'Should redirect to profile' })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiBadRequestResponse({ description: 'Invalid or expired token' })
	@HttpCode(200)
	@Get('change-email/confirm')
	async confirmChangeEmail(
		@Query('userId', ParseUUIDPipe) userId: string,
		@Query('token') token: string,
		@Res({ passthrough: true }) res: Response,
	) {
		await this.securityService.confirmChangeEmail(userId, token)
		return res.redirect(FRONTEND_REDIRECT_LINK)
	}

	@ApiOperation({ summary: 'Send reset password confirmation message' })
	@ApiOkResponse({
		schema: {
			type: 'object',
			properties: {
				message: {
					type: 'string',
					example: 'Письмо с подтверждением отправлено',
				},
			},
		},
	})
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('reset-password')
	@Throttle({ default: { limit: 2, ttl: 10000 } })
	async resetPasswordRequest(@Body() dto: ResetPasswordRequestDto) {
		await this.securityService.sendEmailResetPassword(dto.email)
		return { message: 'Письмо с подтверждением отправлено' }
	}

	@ApiOperation({
		summary: 'Reset password confirm',
		description: 'Handles reset password confirmation link from mail',
	})
	@ApiOkResponse({
		schema: {
			type: 'object',
			properties: {
				message: {
					type: 'string',
					example: 'Password reset successfully',
				},
			},
		},
	})
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiBadRequestResponse({ description: 'Invalid or expired token' })
	@HttpCode(200)
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
