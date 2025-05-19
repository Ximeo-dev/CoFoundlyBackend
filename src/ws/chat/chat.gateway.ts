import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common'
import {
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
	MarkReadMessageDto,
	MessageEditDto,
	SendMessageDto,
	UserTypingDto,
} from '../dto/chat.dto'
import {
	ChatClientEvent,
	ChatServerEvent,
	NotificationServerEvent,
} from '../types/events'
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
		const { message, notificationsMap, recipientIds } =
			await this.chatService.sendMessage(userId, dto)
		if (!message) return
		this.server.to(message.chatId).emit(ChatServerEvent.NEW_MESSAGE, message)

		recipientIds.forEach((userId) => {
			this.server.to(userId).emit(NotificationServerEvent.NEW_NOTIFICATION, {
				notification: notificationsMap.get(userId),
				data: message,
			})
		})

		return message
	}

	@SubscribeMessage(ChatClientEvent.MARK_READ)
	@UsePipes(new ValidationPipe())
	async onMarkRead(
		@WSCurrentUser('id') userId: string,
		@MessageBody() dto: MarkReadMessageDto,
	) {
		const readReceipts = await this.chatService.markMessagesAsRead(
			userId,
			dto.messageIds,
		)

		if (readReceipts.length > 0) {
			this.server
				.to(dto.chatId)
				.emit(ChatServerEvent.MESSAGE_READ, readReceipts)
		}
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
		this.server.to(dto.chatId).emit(ChatServerEvent.MESSAGE_DELETED, message)
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
