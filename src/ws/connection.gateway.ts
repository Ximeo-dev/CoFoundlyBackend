import { Logger, UseFilters } from '@nestjs/common'
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets'
import { AuthSocketService } from 'src/auth/socket/auth-socket.service'
import { WsExceptionFilter } from 'src/exceptions/WsExceptionFilter'
import { AuthenticatedSocket } from './types/socket.types'
import { ChatService } from './chat/chat.service'
import { Server } from 'socket.io'
import { WebsocketService } from './websocket.service'

@WebSocketGateway({
	namespace: '/',
	origin: ['http://localhost:3000', 'https://cofoundly.infinitum.su'],
})
@UseFilters(WsExceptionFilter)
export class ConnectionGateway
	implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
	private logger: Logger = new Logger('ConnectionGateway')
	@WebSocketServer() server: Server

	constructor(
		private readonly websocketService: WebsocketService,
		private readonly authSocketService: AuthSocketService,
		private readonly chatService: ChatService,
	) {}

	async handleConnection(client: AuthenticatedSocket) {
		this.logger.debug(`Client connecting: Client ID - ${client.id}`)
		await this.authSocketService.attachUserToSocket(client)
		const userId = client?.user?.id
		if (!userId || client.disconnected) return
		client.join(userId)
		const chats = await this.chatService.getUserDirectChats(userId)
		chats.forEach((chat) => {
			client.join(chat.id)
		})
		this.logger.debug(`Client connected: User ID - ${userId}`)
	}

	handleDisconnect(client: AuthenticatedSocket) {
		if (client.user && client.user.id) {
			this.logger.debug(`Client disconnected: User ID - ${client.user.id}`)
		} else {
			this.logger.debug(`Client disconnected: Client ID - ${client.id}`)
		}
	}

	afterInit() {
		this.websocketService.setServer(this.server)
	}
}
