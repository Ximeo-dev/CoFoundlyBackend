import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { verify } from 'argon2'
import { plainToClass } from 'class-transformer'
import { randomBytes } from 'crypto'
import { Response } from 'express'
import { TTL_BY_ACTION } from 'src/constants/constants'
import { RedisService } from 'src/redis/redis.service'
import { TelegramService } from 'src/telegram/telegram.service'
import { TwoFactorAction } from 'src/types/2fa.types'
import { hasSecuritySettings } from 'src/types/user.guards'
import { UserWithSecurity } from 'src/types/user.types'
import { UserResponseDto } from 'src/user/dto/user.dto'
import { UserService } from 'src/user/user.service'
import { getEnvVar } from 'src/utils/env'
import { parseBool } from 'src/utils/parseBool'
import * as zxcvbn from 'zxcvbn'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

export enum TwoFAResult {
	UserNotFound,
	AlreadyEnabled,
	TokenExpired,
	Valid,
}

export enum ConfirmTwoFAResult {
	UserNotFound,
	Success,
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
		private readonly redis: RedisService,
	) {}

	async login(dto: LoginDto) {
		const { userData, securitySettings } = await this.validateUser(dto)

		const tokens = this.issueTokens(
			userData.id,
			securitySettings.jwtTokenVersion,
		)

		const user = plainToClass(
			UserResponseDto,
			{ ...userData, securitySettings },
			{
				excludeExtraneousValues: true,
			},
		)

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

		const { securitySettings, ...userData } = userWithSecurity

		const isValid = await verify(securitySettings.passwordHash, dto.password)

		if (!isValid) throw new UnauthorizedException('Неверный логин или пароль')

		return {
			userData,
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

		const { securitySettings, ...userData } = await this.userService.create(dto)

		if (!securitySettings)
			throw new BadRequestException(
				'Во время регистрации возникла ошибка. Попробуйте позже',
			)

		const tokens = this.issueTokens(
			userData.id,
			securitySettings.jwtTokenVersion,
		)

		const user = plainToClass(
			UserResponseDto,
			{ ...userData, securitySettings },
			{
				excludeExtraneousValues: true,
			},
		)

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

	private key2FA(action: TwoFactorAction, token: string): string {
		return `2fa:${action}:${token}`
	}

	async validate2FAToken(
		token: string,
		action: TwoFactorAction,
	): Promise<string | null> {
		const key = this.key2FA(action, token)
		const userId = await this.redis.get(key)
		if (!userId) return null

		await this.redis.del(key)
		return userId
	}

	async issue2FAToken(userId: string, action: TwoFactorAction) {
		let token: string
		do {
			token = randomBytes(8).toString('hex')
		} while (await this.redis.exists(this.key2FA(action, token)))

		const ttl = TTL_BY_ACTION[action] ?? 300
		await this.redis.set(this.key2FA(action, token), userId, ttl)

		return token
	}

	// async handle2FAToken(
	// 	token: string,
	// 	action: TwoFactorAction,
	// ): Promise<{ result: TwoFAResult; user?: User }> {
	// 	const userId = await this.validate2FAToken(token, action)

	// 	if (!userId) {
	// 		return { result: TwoFAResult.TokenExpired }
	// 	}

	// 	const user = await this.userService.getByIdWithSecuritySettings(userId)

	// 	if (!user || !user.securitySettings) {
	// 		return { result: TwoFAResult.UserNotFound }
	// 	}

	// 	const { securitySettings, ...rest } = user

	// 	if (securitySettings.twoFactorEnabled) {
	// 		return { result: TwoFAResult.AlreadyEnabled }
	// 	}

	// 	return { result: TwoFAResult.Valid, user: rest }
	// }

	async handle2FAToken<T>(
		token: string,
		action: TwoFactorAction,
		handler: (user: UserWithSecurity) => Promise<T | undefined>,
	): Promise<{ result: TwoFAResult; user?: T }> {
		const userId = await this.validate2FAToken(token, action)

		if (!userId) {
			return { result: TwoFAResult.TokenExpired }
		}

		const user = await this.userService.getByIdWithSecuritySettings(userId)

		if (!hasSecuritySettings(user)) return { result: TwoFAResult.UserNotFound }

		return {
			result: TwoFAResult.Valid,
			user: await handler(user),
		}
	}

	async confirm2FA(userId: string, telegramId: string) {
		const user = await this.userService.getByIdWithSecuritySettings(userId)

		if (!user || !user.securitySettings) {
			return ConfirmTwoFAResult.UserNotFound
		}

		await this.userService.setTelegramId(userId, telegramId)
		await this.userService.set2FAStatus(userId, true)

		return ConfirmTwoFAResult.Success
	}

	async unbind2FA(userId: string) {}
}
