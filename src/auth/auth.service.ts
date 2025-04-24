import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { verify } from 'argon2'
import { UserService } from 'src/user/user.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { Response } from 'express'
import { getEnvVar } from 'src/utils/env'
import * as zxcvbn from 'zxcvbn'
import { parseBool } from 'src/utils/parseBool'
import { Context } from 'grammy'
import { safeCompare } from 'src/utils/safeCompare'
import {
	TokenValidationResponse,
	TokenValidationResult,
} from 'src/types/token-validation'
import { User } from '@prisma/client'
import { TelegramService } from 'src/telegram/telegram.service'

export enum TwoFAResult {
	UserNotFound,
	AlreadyEnabled,
	TokenExpired,
	Valid,
}

@Injectable()
export class AuthService {
	private EXPIRE_DAY_REFRESH_TOKEN = 3
	public REFRESH_TOKEN_NAME = 'refreshToken'

	constructor(
		private readonly jwt: JwtService,
		private readonly userService: UserService,
		@Inject(forwardRef(() => TelegramService))
		private readonly telegramService: TelegramService,
	) {}

	async login(dto: LoginDto) {
		const { user, securitySettings } = await this.validateUser(dto)

		const tokens = this.issueTokens(user.id, securitySettings.jwtTokenVersion)

		return {
			user,
			...tokens,
		}
	}

	private issueTokens(userId: string, tokenVersion: number) {
		const data = { id: userId, version: tokenVersion }

		const accessToken = this.jwt.sign(data, {
			expiresIn: '3h',
		})

		const refreshToken = this.jwt.sign(data, {
			expiresIn: '3d',
		})

		return { accessToken, refreshToken }
	}

	private async validateUser(dto: LoginDto) {
		const userWithSecurity =
			await this.userService.getByEmailWithSecuritySettings(dto.email)

		if (!userWithSecurity || !userWithSecurity.securitySettings)
			throw new UnauthorizedException('Неверный email или пароль')

		const { securitySettings, ...user } = userWithSecurity

		const isValid = await verify(securitySettings.passwordHash, dto.password)

		if (!isValid) throw new UnauthorizedException('Неверный логин или пароль')

		return {
			user,
			securitySettings,
		}
	}

	async register(dto: RegisterDto) {
		const oldEmailUser = await this.userService.getByEmail(dto.email)

		if (oldEmailUser)
			throw new BadRequestException('Аккаунт с такой почтой уже существует')

		const result = zxcvbn(dto.password)

		if (result.score <= 1)
			throw new BadRequestException('Пароль слишком простой')

		const { securitySettings, ...user } = await this.userService.create(dto)

		if (!securitySettings)
			throw new BadRequestException(
				'Во время регистрации возникла ошибка. Попробуйте позже',
			)

		const tokens = this.issueTokens(user.id, securitySettings.jwtTokenVersion)

		return {
			user,
			...tokens,
		}
	}

	addRefreshTokenToResponse(res: Response, refreshToken: string) {
		//Когда фронт будет на infinitum.su, domain=infinitum.su, sameSite=lax
		//Secure=true на проде
		const expiresIn = new Date()
		expiresIn.setDate(expiresIn.getDate() + this.EXPIRE_DAY_REFRESH_TOKEN)

		res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
			httpOnly: true,
			expires: expiresIn,
			secure: parseBool(getEnvVar('SECURE_REFRESH_TOKEN')),
			domain: getEnvVar('DOMAIN'),
			sameSite: getEnvVar('SAME_SITE') as 'lax' | 'strict' | 'none',
		})

		//Для сайта на localhost
		res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
			httpOnly: true,
			expires: expiresIn,
			secure: parseBool(getEnvVar('SECURE_REFRESH_TOKEN')),
			domain: 'localhost',
			sameSite: getEnvVar('SAME_SITE') as 'lax' | 'strict' | 'none',
		})
	}

	removeRefreshTokenFromResponse(res: Response) {
		res.cookie(this.REFRESH_TOKEN_NAME, '', {
			httpOnly: true,
			domain: getEnvVar('DOMAIN'),
			expires: new Date(0),
			secure: parseBool(getEnvVar('SECURE_REFRESH_TOKEN')),
			sameSite: getEnvVar('SAME_SITE') as 'lax' | 'strict' | 'none',
		})
		//Для сайта на localhost
		res.cookie(this.REFRESH_TOKEN_NAME, '', {
			httpOnly: true,
			domain: 'localhost',
			expires: new Date(0),
			secure: parseBool(getEnvVar('SECURE_REFRESH_TOKEN')),
			sameSite: getEnvVar('SAME_SITE') as 'lax' | 'strict' | 'none',
		})
	}

	async getNewTokens(refreshToken: string, res: Response) {
		try {
			const result = await this.jwt.verifyAsync(refreshToken)
			if (!result) {
				this.removeRefreshTokenFromResponse(res)
				throw new UnauthorizedException('Invalid refresh token')
			}

			const user = await this.userService.getByIdWithSecuritySettings(result.id)

			if (!user || !user.securitySettings)
				throw new UnauthorizedException('Invalid user')

			const { securitySettings, ...userData } = user

			const tokens = this.issueTokens(user.id, securitySettings.jwtTokenVersion)

			return {
				userData,
				...tokens,
			}
		} catch (e) {
			this.removeRefreshTokenFromResponse(res)
			throw new UnauthorizedException('Invalid refresh token')
		}
	}

	async get2FAToken(userId: string) {
		const user = await this.userService.getByIdWithSecuritySettings(userId)

		if (!user || !user.securitySettings)
			throw new UnauthorizedException('Invalid user')

		const { securitySettings } = user

		if (securitySettings.twoFactorEnabled)
			throw new BadRequestException('2FA уже подключена к вашему аккаунту')

		const token = await this.issue2FAToken(user.id)
		await this.userService.set2FAToken(user.id, token)
		return token
	}

	async issue2FAToken(userId: string) {
		const data = { id: userId }

		return this.jwt.sign(data, {
			expiresIn: '10m',
		})
	}

	private async getPayloadFrom2FAToken(
		token: string,
	): Promise<TokenValidationResponse> {
		try {
			const payload = await this.jwt.verifyAsync<{ id: string }>(token)

			return {
				result: TokenValidationResult.Valid,
				payload,
			}
		} catch (error) {
			if (error.name === 'TokenExpiredError') {
				return { result: TokenValidationResult.Expired }
			} else {
				return { result: TokenValidationResult.Invalid }
			}
		}
	}

	async handle2FAToken(
		token: string,
	): Promise<{ result: TwoFAResult; user?: User }> {
		const validation = await this.getPayloadFrom2FAToken(token)

		if (validation.result === TokenValidationResult.Expired) {
			return { result: TwoFAResult.TokenExpired }
		}

		if (
			validation.result === TokenValidationResult.Invalid ||
			validation.result !== TokenValidationResult.Valid
		) {
			return { result: TwoFAResult.UserNotFound }
		}

		const payload = validation.payload

		const user = await this.userService.getByIdWithSecuritySettings(payload.id)

		if (!user || !user.securitySettings) {
			return { result: TwoFAResult.UserNotFound }
		}

		const { securitySettings, ...rest } = user

		if (securitySettings.twoFactorEnabled) {
			await this.userService.set2FAToken(user.id, null)
			return { result: TwoFAResult.AlreadyEnabled }
		}

		if (!safeCompare(securitySettings.twoFactorToken, token)) {
			await this.userService.set2FAToken(user.id, null)
			return { result: TwoFAResult.TokenExpired }
		}

		await this.userService.set2FAToken(user.id, null)
		return { result: TwoFAResult.Valid, user: rest }
	}

	async confirm2FA(userId: string, telegramId: string, ctx: Context) {
		const user = await this.userService.getByIdWithSecuritySettings(userId)

		if (!user || !user.securitySettings) {
			await ctx.reply('Пользователь не найден')
			return
		}

		await this.userService.setTelegramId(userId, telegramId)
		await this.userService.set2FAStatus(userId, true)

		await ctx.answerCallbackQuery({ text: '✅ Привязка успешно завершена' })
		await ctx.editMessageText('✅ Telegram успешно привязан к аккаунту.')
	}

	async unbind2FA(userId: string) {
		
	}
}
