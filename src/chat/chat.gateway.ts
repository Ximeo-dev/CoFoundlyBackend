import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import {
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { WSAuth } from 'src/auth/decorators/ws-auth.decorator'
import { UserService } from 'src/user/user.service'
import { ChatService } from './chat.service'
import { CurrentUser } from 'src/auth/decorators/user.decorator'

@WebSocketGateway({
	cors: {
		origin: ['http://localhost:3000', 'https://cofoundly.infinitum.su'],
	},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	private logger: Logger = new Logger('ChatGateway')
	@WebSocketServer() server: Server

	constructor(
		private readonly chatService: ChatService,
		private jwtService: JwtService,
		private configService: ConfigService,
		private userService: UserService,
	) {}

	async handleConnection(client: Socket) {
		const token =
			client.handshake.auth?.token ||
			client.handshake.headers?.authorization?.split(' ')[1]

		if (!token) {
			this.server.emit('auth_error', 'Missing token')
			return client.disconnect()
		}

		try {
			const payload = this.jwtService.verify(token, {
				secret: this.configService.getOrThrow('JWT_SECRET'),
			})
			const user = await this.userService.getByIdWithSecuritySettings(
				payload.id,
			)
			if (!user || user.securitySettings?.jwtTokenVersion !== payload.version) {
				this.server.emit('auth_error', 'Invalid or expired token')
				return client.disconnect()
			}

			;(client as any).user = user
		} catch (err) {
			this.server.emit('auth_error', 'Invalid or expired token')
			client.disconnect()
		}
	}

	handleDisconnect(client: Socket) {
		this.logger.debug(`Client disconnected: ${client.id}`)
	}

	@SubscribeMessage('sendMessage')
	async handleSendMessage(
		@CurrentUser('id') id: string,
		@MessageBody() dto: any,
	) {
		this.server.emit('newMessage', dto, `User id - ${id}`)
	}
}
