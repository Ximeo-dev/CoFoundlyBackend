import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common'
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { WSCurrentUser } from 'src/auth/decorators/ws-user.decorator'
import { AuthSocketService } from 'src/auth/socket/auth-socket.service'
import { WsExceptionFilter } from 'src/exceptions/WsExceptionFilter'
import { ChatService } from './chat.service'
import {
	DeleteMessageDto,
	MarkReadDto,
	MessageEditDto,
	SendMessageDto,
	UserTypingDto,
} from './dto/chat.dto'
import { ChatClientEvent, ChatServerEvent } from './types/chat-events'
import { AuthenticatedSocket } from './types/socket.types'

@WebSocketGateway({
	namespace: '/chat',
	origin: ['http://localhost:3000', 'https://cofoundly.infinitum.su'],
})
@UseFilters(WsExceptionFilter)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	private logger: Logger = new Logger('ChatGateway')
	@WebSocketServer() server: Server

	constructor(
		private readonly chatService: ChatService,
		private readonly authSocketService: AuthSocketService,
	) {}

	async handleConnection(client: AuthenticatedSocket) {
		await this.authSocketService.attachUserToSocket(client)
		const userId = client?.user?.id
		if (!userId) return
		client.join(userId)
		const chats = await this.chatService.getUserDirectChats(userId)
		chats.forEach((chat) => {
			client.join(chat.id)
		})
		this.logger.debug(`Client connected: ${client.id}`)
	}

	handleDisconnect(client: Socket) {
		this.logger.debug(`Client disconnected: ${client.id}`)
	}

	@SubscribeMessage(ChatClientEvent.SEND_MESSAGE)
	@UsePipes(new ValidationPipe())
	async onSendMessage(
		@WSCurrentUser('id') userId: string,
		@MessageBody() dto: SendMessageDto,
		@ConnectedSocket() client: AuthenticatedSocket,
	) {
		const { message, isNewChat } = await this.chatService.sendMessage(
			userId,
			dto,
		)
		if (isNewChat) {
			client.join(message.chatId)
			const recipientSockets = await this.server
				.in(dto.recipientId)
				.fetchSockets()
			recipientSockets.forEach((socket) => {
				socket.join(message.chatId)
			})
		}
		this.server.to(message.chatId).emit(ChatServerEvent.NEW_MESSAGE, message)
		return message
	}

	@SubscribeMessage(ChatClientEvent.MARK_READ)
	@UsePipes(new ValidationPipe())
	async onMarkRead(
		@WSCurrentUser('id') userId: string,
		@MessageBody() dto: MarkReadDto,
	) {
		await this.chatService.markAsRead(userId, dto.chatId)
		this.server
			.to(dto.chatId)
			.emit(ChatServerEvent.READ, { chatId: dto.chatId, userId })
	}

	@SubscribeMessage(ChatClientEvent.TYPING)
	@UsePipes(new ValidationPipe())
	async onTyping(
		@WSCurrentUser('id') userId: string,
		@MessageBody() dto: UserTypingDto,
	) {
		this.server
			.to(dto.chatId)
			.emit(ChatServerEvent.USER_TYPING, { userId, typing: dto.isTyping })
	}

	@SubscribeMessage(ChatClientEvent.DELETE_MESSAGE)
	@UsePipes(new ValidationPipe())
	async onDeleteMessage(
		@WSCurrentUser('id') userId: string,
		@MessageBody() dto: DeleteMessageDto,
	) {
		const message = await this.chatService.deleteMessage(userId, dto)
		this.server
			.to(dto.chatId)
			.emit(ChatServerEvent.MESSAGE_DELETED, { messageId: dto.messageId })
	}

	@SubscribeMessage(ChatClientEvent.EDIT_MESSAGE)
	@UsePipes(new ValidationPipe())
	async onEditMessage(
		@WSCurrentUser('id') userId: string,
		@MessageBody() dto: MessageEditDto,
	) {
		const message = await this.chatService.editMessage(userId, dto)
		this.server.to(dto.chatId).emit(ChatServerEvent.MESSAGE_EDITED, message)
	}
}
