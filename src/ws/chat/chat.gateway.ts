import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common'
import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets'
import { Server } from 'socket.io'
import { WSCurrentUser } from 'src/auth/decorators/ws-user.decorator'
import { WsExceptionFilter } from 'src/exceptions/WsExceptionFilter'
import {
	DeleteMessageDto,
	MarkReadDto,
	MessageEditDto,
	SendMessageDto,
	UserTypingDto,
} from '../dto/chat.dto'
import { ChatClientEvent, ChatServerEvent } from '../types/chat-events'
import { AuthenticatedSocket } from '../types/socket.types'
import { ChatService } from './chat.service'

@WebSocketGateway({
	namespace: '/',
})
@UseFilters(WsExceptionFilter)
export class ChatGateway {
	@WebSocketServer() server: Server

	constructor(private readonly chatService: ChatService) {}

	@SubscribeMessage(ChatClientEvent.SEND_MESSAGE)
	@UsePipes(new ValidationPipe())
	async onSendMessage(
		@WSCurrentUser('id') userId: string,
		@MessageBody() dto: SendMessageDto,
	) {
		const message = await this.chatService.sendMessage(userId, dto)
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
