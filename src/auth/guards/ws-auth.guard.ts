import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { hasSecuritySettings } from 'src/user/types/user.guards'
import { UserService } from 'src/user/user.service'
import { AuthenticatedSocket } from 'src/ws/types/socket.types'

@Injectable()
export class WSAuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private configService: ConfigService,
		private userService: UserService,
	) {}

	async canActivate(context: ExecutionContext) {
		const client: AuthenticatedSocket = context.switchToWs().getClient()
		const token =
			client.handshake.auth?.token ||
			client.handshake.query?.token ||
			client.handshake.headers?.authorization?.split(' ')[1]

		if (!token) {
			client.emit('errors', 'Missing token')
			client.disconnect()
			return false
		}

		try {
			const payload = this.jwtService.verify(token, {
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
				client.disconnect()
				return false
			}

			client.user = user
			return true
		} catch (err) {
			client.emit('errors', 'Unauthorized WebSocket access')
			client.disconnect()
			return false
		}
	}
}
