import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Query,
	Req,
	Res,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { UserService } from 'src/user/user.service'
import { AuthService } from './auth.service'
import { LoginDto, LoginResponseDto } from './dto/login.dto'
import {
	EmailAvailableDto,
	RegisterDto,
	UsernameAvailableDto,
} from './dto/register.dto'
import { Auth } from './decorators/auth.decorator'
import { CurrentUser } from './decorators/user.decorator'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger'

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService,
	) {}

	@ApiResponse({
		status: HttpStatus.OK,
		type: LoginResponseDto,
	})
	@ApiUnauthorizedResponse({ description: 'Неверный email или пароль' })
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('login')
	@Throttle({ default: { limit: 4, ttl: 10000 } })
	@UseGuards(ThrottlerGuard)
	async login(
		@Body() dto: LoginDto,
		@Res({ passthrough: true }) res: Response,
	) {
		const { refreshToken, ...response } = await this.authService.login(dto)
		this.authService.addRefreshTokenToResponse(res, refreshToken)

		return response
	}

	@ApiResponse({
		status: HttpStatus.OK,
		type: LoginResponseDto,
	})
	@ApiBadRequestResponse({
		description: 'Аккаунт с такой почтой уже существует',
	})
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('register')
	@Throttle({ default: { limit: 2, ttl: 10000 } })
	@UseGuards(ThrottlerGuard)
	async register(
		@Body() dto: RegisterDto,
		@Res({ passthrough: true }) res: Response,
	) {
		const { refreshToken, ...response } = await this.authService.register(dto)
		this.authService.addRefreshTokenToResponse(res, refreshToken)

		return response
	}

	@ApiBearerAuth()
	@ApiOkResponse({ type: Boolean })
	@HttpCode(200)
	@Post('logout')
	@Auth()
	async logout(
		@CurrentUser('id') userId: string,
		@Res({ passthrough: true }) res: Response,
	) {
		return this.authService.logout(userId, res)
	}

	@ApiOperation({ summary: 'Update access token with refresh token' })
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

	@ApiOperation({ summary: 'Check if email is already used' })
	@ApiOkResponse({ type: Boolean, example: true })
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Get('register/email-available')
	async checkEmailAvailable(@Query() dto: EmailAvailableDto) {
		const user = await this.userService.getByEmail(dto.email)

		if (!user) return true
		return false
	}

	@ApiOkResponse({ type: Boolean, example: true })
	@ApiOperation({ summary: 'Check if username is already used' })
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Get('register/username-available')
	async checkUsernameAvailable(@Query() dto: UsernameAvailableDto) {
		const user = await this.userService.getByUsername(dto.username)

		if (!user) return true
		return false
	}
}
