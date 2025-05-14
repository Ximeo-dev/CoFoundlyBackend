// chat.gateway.ts
import {
	WebSocketGateway,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket,
	OnGatewayInit,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Socket, Server } from 'socket.io'
import { Logger } from '@nestjs/common'

@WebSocketGateway({
	cors: {
		origin: ['http://localhost:3000', 'https://cofoundly.infinitum.su'],
	},
})
export class ChatGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	private logger: Logger = new Logger('ChatGateway')

	afterInit(server: Server) {
		this.logger.log('WebSocket initialized')
	}

	handleConnection(client: Socket) {
		this.logger.log(`Client connected: ${client.id}`)
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`)
	}

	@SubscribeMessage('joinChat')
	handleJoinChat(
		@MessageBody() data: { chatId: string },
		@ConnectedSocket() client: Socket,
	) {
		client.join(data.chatId) // socket.io room
		this.logger.log(`Client ${client.id} joined chat ${data.chatId}`)
	}

	@SubscribeMessage('sendMessage')
	handleSendMessage(
		@MessageBody()
		data: {
			chatId: string
			senderId: string
			content: string
		},
		@ConnectedSocket() client: Socket,
	) {
		// позже: сохрани в БД сообщение
		const message = {
			...data,
			sentAt: new Date().toISOString(),
		}

		// Отправим всем в комнате чата, включая отправителя
		client.to(data.chatId).emit('newMessage', message)
		client.emit('newMessage', message)
	}
}
