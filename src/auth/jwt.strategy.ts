import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, ExtractJwt } from 'passport-jwt'
import { UserService } from 'src/user/user.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private configService: ConfigService,
		private userService: UserService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.get('JWT_SECRET'),
		})
	}

	// validate with token version
	// async validate({ id, version }: { id: string; version: number }) {
	// 	const user = await this.userService.getById(id)

	// 	if (!user || user.jwtTokenVersion !== version) {
	// 		throw new UnauthorizedException('Token is invalid or expired')
	// 	}

	// 	return user
	// }

	async validate({ id }: { id: string }) {
		const user = await this.userService.getById(id)

		if (!user) {
			throw new UnauthorizedException('Token is invalid')
		}

		return user
	}
}
