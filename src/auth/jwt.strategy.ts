import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, ExtractJwt } from 'passport-jwt'
import { UserService } from 'src/user/user.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly configService: ConfigService,
		private readonly userService: UserService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
		})
	}

	async validate({ id, version }: { id: string; version: number }) {
		const user = await this.userService.getByIdWithSecuritySettings(id)

		if (!user || user.securitySettings?.jwtTokenVersion !== version) {
			throw new UnauthorizedException('Token is invalid or expired')
		}

		return user
	}
}
