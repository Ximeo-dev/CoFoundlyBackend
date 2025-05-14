import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Socket } from 'socket.io'
import { UserService } from 'src/user/user.service'

@Injectable()
export class WSAuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private configService: ConfigService,
		private userService: UserService,
	) {}

	async canActivate(context: ExecutionContext) {
		const client: Socket = context.switchToWs().getClient()
		const token =
			client.handshake.auth?.token ||
			client.handshake.query?.token ||
			client.handshake.headers?.authorization?.split(' ')[1]

		if (!token) {
			client.emit('auth_error', 'Missing token')
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
			if (!user || user.securitySettings?.jwtTokenVersion !== payload.version) {
				client.emit('auth_error', 'Invalid or expired token')
				client.disconnect()
				return false
			}

			;(client as any).user = user
			return true
		} catch (err) {
			client.emit('auth_error', 'Unauthorized WebSocket access')
			client.disconnect()
			return false
		}
	}
}
