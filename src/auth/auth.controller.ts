import {
	BadRequestException,
	Body,
	Controller,
	Get,
	HttpCode,
	Post,
	Query,
	Req,
	Res,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { Request, Response } from 'express'
import { EmailAvailableDto, RegisterDto } from './dto/register.dto'
import { UserService } from 'src/user/user.service'
import {
	ResetPasswordConfirmDto,
	ResetPasswordRequestDto,
} from './dto/reset-password.dto'
import { EmailService } from 'src/email/email.service'
import { Auth } from './decorators/auth.decorator'
import { CurrentUser } from './decorators/user.decorator'
import { TwoFactorAction } from 'src/types/2fa.types'

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService,
		private readonly emailService: EmailService,
	) {}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('login')
	async login(
		@Body() dto: LoginDto,
		@Res({ passthrough: true }) res: Response,
		@Req() req: Request,
	) {
		// const forwarded = req.headers['x-forwarded-for'] as string
		// const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip

		const { refreshToken, ...response } = await this.authService.login(dto)
		this.authService.addRefreshTokenToResponse(res, refreshToken)

		return response
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('register')
	async register(
		@Body() dto: RegisterDto,
		@Res({ passthrough: true }) res: Response,
		@Req() req: Request,
	) {
		// const forwarded = req.headers['x-forwarded-for'] as string
		// const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip

		const { refreshToken, ...response } = await this.authService.register(dto)
		this.authService.addRefreshTokenToResponse(res, refreshToken)

		return response
	}

	@HttpCode(200)
	@Post('logout')
	async logout(@Res({ passthrough: true }) res: Response) {
		this.authService.removeRefreshTokenFromResponse(res)

		return true
	}

	@HttpCode(200)
	@Post('login/access-token')
	async getNewTokens(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		const refreshTokenFromCookies =
			req.cookies[this.authService.REFRESH_TOKEN_NAME]

		if (!refreshTokenFromCookies) {
			this.authService.removeRefreshTokenFromResponse(res)
			// throw new UnauthorizedException('Refresh token not passed')
			return {
				message: 'Refresh token not passed',
			}
		}

		const { refreshToken, ...response } = await this.authService.getNewTokens(
			refreshTokenFromCookies,
			res,
		)

		this.authService.addRefreshTokenToResponse(res, refreshToken)

		return response
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Get('register/email-available')
	async checkEmailAvailable(@Query() dto: EmailAvailableDto) {
		const user = await this.userService.getByEmail(dto.email)

		if (!user) return true
		return false
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('reset-password')
	async resetPasswordRequest(@Body() dto: ResetPasswordRequestDto) {
		await this.emailService.sendEmailResetPassword(dto.email)

		return { message: 'Confirmation email sent' }
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('reset-password/confirm')
	async confirmEmail(
		@Query('token') token: string,
		@Body() dto: ResetPasswordConfirmDto,
	) {
		const payload = await this.emailService.getPayloadFromToken(token)
		await this.emailService.handleResetPasswordConfirmationToken(token, payload)
		return this.emailService.confirmResetPassword(payload.id, dto)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('2fa-bind')
	@Auth()
	async get2FAToken(@CurrentUser('id') id: string) {
		const securitySettings =
			await this.userService.getUserSecuritySettingsById(id)

		if (securitySettings?.twoFactorEnabled)
			throw new BadRequestException('2FA уже подключена к вашему аккаунту')
		return this.authService.issue2FAToken(id, TwoFactorAction.BIND)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('2fa-unbind')
	@Auth()
	async unbind2FA(@CurrentUser('id') id: string) {
		return this.authService.unbind2FA(id)
	}
}
