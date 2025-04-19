import {
	BadRequestException,
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

@Injectable()
export class AuthService {
	private EXPIRE_DAY_REFRESH_TOKEN = 3
	public REFRESH_TOKEN_NAME = 'refreshToken'

	constructor(
		private jwt: JwtService,
		private userService: UserService,
	) {}

	async login(dto: LoginDto) {
		const validatedUser = await this.validateUser(dto)

		const tokens = this.issueTokens(validatedUser.id)

		return {
			validatedUser,
			...tokens,
		}
	}

	private issueTokens(userId: string) {
		const data = { id: userId }

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

		const isValid = await verify(
			securitySettings.passwordHash,
			dto.password,
		)

		if (!isValid) throw new UnauthorizedException('Неверный логин или пароль')

		return user
	}

	async register(dto: RegisterDto) {
		const oldEmailUser = await this.userService.getByEmail(dto.email)

		if (oldEmailUser)
			throw new BadRequestException('Аккаунт с такой почтой уже существует')

		const result = zxcvbn(dto.password)

		if (result.score <= 1)
			throw new BadRequestException('Пароль слишком простой')

		const user = await this.userService.create(dto)

		const tokens = this.issueTokens(user.id)

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
			secure: true,
			domain: getEnvVar('DOMAIN'),
			sameSite: getEnvVar('SAME_SITE') as 'lax' | 'strict' | 'none',
		})

		//Для сайта на localhost
		res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
			httpOnly: true,
			expires: expiresIn,
			secure: true,
			domain: 'localhost',
			sameSite: getEnvVar('SAME_SITE') as 'lax' | 'strict' | 'none',
		})
	}

	removeRefreshTokenFromResponse(res: Response) {
		res.cookie(this.REFRESH_TOKEN_NAME, '', {
			httpOnly: true,
			domain: getEnvVar('DOMAIN'),
			expires: new Date(0),
			secure: true,
			sameSite: getEnvVar('SAME_SITE') as 'lax' | 'strict' | 'none',
		})
		//Для сайта на localhost
		res.cookie(this.REFRESH_TOKEN_NAME, '', {
			httpOnly: true,
			domain: 'localhost',
			expires: new Date(0),
			secure: true,
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

			const user = await this.userService.getById(result.id)

			if (!user) throw new UnauthorizedException('Invalid user')

			const tokens = this.issueTokens(user.id)

			return {
				user,
				...tokens,
			}
		} catch (e) {
			this.removeRefreshTokenFromResponse(res)
			throw new UnauthorizedException('Invalid refresh token')
		}
	}
}
