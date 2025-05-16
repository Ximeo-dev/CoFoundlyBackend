import {
	BadRequestException,
	ForbiddenException,
	Injectable,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import {
	DeleteMessageDto,
	GetMessagesDto,
	MessageEditDto,
	SendMessageDto,
} from './dto/chat.dto'
import { ChatResponseDto } from './dto/response.dto'
import { UserProfileService } from 'src/profile/user-profile.service'
import { ChatParticipant } from './types/chat.types'

@Injectable()
export class ChatService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly userProfileService: UserProfileService,
	) {}

	async getUserDirectChats(userId: string) {
		const chats = await this.prisma.chat.findMany({
			where: {
				participants: { some: { id: userId } },
				type: 'DIRECT',
			},
			include: {
				participants: {
					select: {
						id: true,
						displayUsername: true,
					},
				},
				messages: { take: 1, orderBy: { sentAt: 'desc' } },
			},
		})

		const participantIds = Array.from(
			new Set(
				chats.flatMap((chat) =>
					chat.participants.filter((p) => p.id !== userId).map((p) => p.id),
				),
			),
		)

		const profiles =
			await this.userProfileService.getForeignUsersProfiles(participantIds)
		const profileMap = new Map(
			participantIds.map((id, index) => [id, profiles[index]]),
		)

		const response: ChatResponseDto[] = chats.map((chat) => {
			const participants: ChatParticipant[] = chat.participants
				.filter((p) => p.id !== userId)
				.map((participant) => ({
					userId: participant.id,
					displayUsername: participant.displayUsername,
					profile: profileMap.get(participant.id),
				}))

			return {
				id: chat.id,
				type: chat.type,
				participants,
				messages: chat.messages,
			}
		})

		return response
	}

	async sendMessage(userId: string, dto: SendMessageDto) {
		if (userId === dto.recipientId)
			throw new BadRequestException('You cannot message yourself')

		let chat = await this.prisma.chat.findFirst({
			where: {
				type: 'DIRECT',
				participants: { every: { id: { in: [userId, dto.recipientId] } } },
			},
		})
		const isNewChat = !chat
		if (!chat) {
			chat = await this.prisma.chat.create({
				data: {
					type: 'DIRECT',
					participants: { connect: [{ id: userId }, { id: dto.recipientId }] },
				},
			})
		}

		const message = await this.prisma.message.create({
			data: {
				chatId: chat.id,
				senderId: userId,
				content: dto.content,
			},
		})

		return { message, isNewChat }
	}

	async getMessages(userId: string, chatId: string, dto: GetMessagesDto) {
		const { page, limit } = dto
		const chat = await this.prisma.chat.findFirst({
			where: { id: chatId, participants: { some: { id: userId } } },
		})
		if (!chat) throw new ForbiddenException('Chat not found or access denied')

		return this.prisma.message.findMany({
			where: { chatId },
			orderBy: { sentAt: 'asc' },
			skip: (page - 1) * limit,
			take: limit,
			include: { sender: { select: { id: true, displayUsername: true } } },
		})
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
