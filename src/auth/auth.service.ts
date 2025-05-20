import {
	BadRequestException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { verify } from 'argon2'
import { plainToClass } from 'class-transformer'
import { Response } from 'express'
import { UserResponseDto } from 'src/user/dto/user.dto'
import { UserService } from 'src/user/user.service'
import { getEnvVar } from 'src/utils/env'
import { parseBool } from 'src/utils/parse-bool'
import * as zxcvbn from 'zxcvbn'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { WebsocketService } from 'src/ws/websocket.service'
import {
	ACCESS_TOKEN_TTL,
	REFRESH_TOKEN_EXPIRE_DAYS,
	REFRESH_TOKEN_TTL,
} from 'src/constants/constants'
import { ConfigService } from '@nestjs/config'

type SameSiteType = 'lax' | 'strict' | 'none'

@Injectable()
export class AuthService {
	public REFRESH_TOKEN_NAME = 'refreshToken'

	constructor(
		private readonly jwt: JwtService,
		private readonly userService: UserService,
		private readonly websocketService: WebsocketService,
		private readonly configService: ConfigService,
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
			expiresIn: ACCESS_TOKEN_TTL,
		})

		const refreshToken = this.jwt.sign(data, {
			expiresIn: REFRESH_TOKEN_TTL,
		})

		return { accessToken, refreshToken }
	}

	public async validateUser(dto: LoginDto) {
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
		const expiresIn = new Date()
		expiresIn.setDate(expiresIn.getDate() + REFRESH_TOKEN_EXPIRE_DAYS)

		res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
			httpOnly: true,
			expires: expiresIn,
			secure: parseBool(
				this.configService.getOrThrow<string>('SECURE_REFRESH_TOKEN'),
			),
			domain: this.configService.getOrThrow<string>('DOMAIN'),
			sameSite: this.configService.getOrThrow<SameSiteType>('SAME_SITE'),
		})

		//Для фронта на localhost
		res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
			httpOnly: true,
			expires: expiresIn,
			secure: parseBool(
				this.configService.getOrThrow<string>('SECURE_REFRESH_TOKEN'),
			),
			domain: 'localhost',
			sameSite: this.configService.getOrThrow<SameSiteType>('SAME_SITE'),
		})
	}

	removeRefreshTokenFromResponse(res: Response) {
		res.cookie(this.REFRESH_TOKEN_NAME, '', {
			httpOnly: true,
			expires: new Date(0),
			secure: parseBool(
				this.configService.getOrThrow<string>('SECURE_REFRESH_TOKEN'),
			),
			domain: this.configService.getOrThrow<string>('DOMAIN'),
			sameSite: this.configService.getOrThrow<SameSiteType>('SAME_SITE'),
		})
		//Для фронта на localhost
		res.cookie(this.REFRESH_TOKEN_NAME, '', {
			httpOnly: true,
			expires: new Date(0),
			secure: parseBool(
				this.configService.getOrThrow<string>('SECURE_REFRESH_TOKEN'),
			),
			domain: 'localhost',
			sameSite: this.configService.getOrThrow<SameSiteType>('SAME_SITE'),
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

	logout(userId: string, res: Response) {
		this.removeRefreshTokenFromResponse(res)

		this.websocketService.server.in(userId).disconnectSockets(true)

		return true
	}
}
