import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { hasSecuritySettings } from 'src/user/types/user.guards'
import { UserService } from 'src/user/user.service'
import { AuthenticatedSocket } from 'src/ws/types/socket.types'

interface TokenPayload {
	id: string
	version: number
}

@Injectable()
export class AuthSocketService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly userService: UserService,
	) {}

	async attachUserToSocket(client: AuthenticatedSocket) {
		const token =
			client.handshake.auth?.token ||
			client.handshake.headers?.authorization?.split(' ')[1]

		if (!token) {
			client.emit('errors', 'Missing token')
			return client.disconnect()
		}

		try {
			const payload = this.jwtService.verify<TokenPayload>(token, {
				secret: this.configService.getOrThrow<string>('JWT_SECRET'),
			})
			const user = await this.userService.getByIdWithSecuritySettings(
				payload.id,
			)
			if (
				!user ||
				!hasSecuritySettings(user) ||
				user.securitySettings.jwtTokenVersion !== payload.version
			) {
				client.emit('errors', 'Invalid or expired token')
				return client.disconnect()
			}

			client.user = user
		} catch (err) {
			client.emit('errors', 'Invalid or expired token')
			client.disconnect()
		}
	}
}
