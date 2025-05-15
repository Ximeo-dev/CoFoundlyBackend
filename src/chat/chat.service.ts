import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import {
	DeleteMessageDto,
	GetMessagesDto,
	MessageEditDto,
	SendMessageDto,
} from './dto/message.dto'

@Injectable()
export class ChatService {
	constructor(private readonly prisma: PrismaService) {}

	async createDirectChat(senderId: string, recipientId: string) {
		const participants = [senderId, recipientId]

		const chats = await this.prisma.chat.findMany({
			where: {
				type: 'DIRECT',
				participants: {
					every: {
						id: { in: participants },
					},
				},
			},
			include: {
				participants: true,
			},
		})

		const existingChat = chats.find((chat) => chat.participants.length === 2)

		if (existingChat) {
			return existingChat
		}

		const newChat = await this.prisma.chat.create({
			data: {
				type: 'DIRECT',
				participants: {
					connect: participants.map((id) => ({ id })),
				},
			},
			include: {
				participants: true,
			},
		})

		return newChat
	}

	async getUserDirectChats(userId: string) {
		return this.prisma.chat.findMany({
			where: {
				participants: { some: { id: userId } },
				type: 'DIRECT',
			},
		})
	}

	async sendMessage(userId: string, dto: SendMessageDto) {
		let chat = await this.prisma.chat.findFirst({
			where: {
				type: 'DIRECT',
				participants: { every: { id: { in: [userId, dto.recipientId] } } },
			},
		})

		if (!chat) {
			chat = await this.prisma.chat.create({
				data: {
					type: 'DIRECT',
					participants: { connect: [{ id: userId }, { id: dto.recipientId }] },
				},
			})
		}

		return this.prisma.message.create({
			data: {
				chatId: chat.id,
				senderId: userId,
				content: dto.content,
			},
		})
	}

	async getMessages(userId: string, chatId: string) {
		const chat = await this.prisma.chat.findFirst({
			where: { id: chatId, participants: { some: { id: userId } } },
		})
		if (!chat) throw new Error('Chat not found or access denied')
		return this.prisma.message.findMany({ where: { chatId } })
	}

	async markAsRead(userId: string, chatId: string) {
		const unreadMessages = await this.prisma.message.findMany({
			where: { chatId, readReceipt: { NOT: { userId } } },
		})
		await this.prisma.readReceipt.createMany({
			data: unreadMessages.map((msg) => ({
				messageId: msg.id,
				userId,
			})),
		})
	}

	async deleteMessage(userId: string, dto: DeleteMessageDto) {
		const message = await this.prisma.message.findFirst({
			where: { id: dto.messageId, senderId: userId },
		})
		if (!message) throw new Error('Message not found')
		await this.prisma.message.delete({ where: { id: dto.messageId } })
		return message
	}

	async editMessage(userId: string, dto: MessageEditDto) {
		const message = await this.prisma.message.findFirst({
			where: { id: dto.messageId, senderId: userId },
		})
		if (!message) throw new Error('Message not found or not authorized')
		return this.prisma.message.update({
			where: { id: dto.messageId },
			data: { content: dto.content, isEdited: true },
		})
	}
}
