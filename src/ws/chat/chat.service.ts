import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { UserProfileService } from 'src/profile/user-profile.service'
import {
	DeleteMessageDto,
	GetMessagesDto,
	MessageEditDto,
	SendMessageDto,
} from '../dto/chat.dto'
import { ChatResponseDto } from '../dto/response.dto'
import { ChatParticipant } from '../types/chat.types'
import { Chat, ChatType } from '@prisma/client'

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
		const chat = await this.prisma.chat.findUnique({
			where: {
				id: dto.chatId,
			},
		})

		if (!chat)
			throw new NotFoundException(`Chat with id ${dto.chatId} not found`)

		const message = await this.prisma.message.create({
			data: {
				chatId: chat.id,
				senderId: userId,
				content: dto.content,
			},
		})

		return message
	}

	async createChat(
		participantIds: string[],
		type: ChatType,
		projectId?: string,
	) {
		if (type === 'DIRECT' && participantIds.length !== 2) {
			throw new BadRequestException(
				'Direct chat must have exactly 2 participants',
			)
		}

		if (type === 'PROJECT' && !projectId) {
			throw new BadRequestException('Project chat must have a projectId')
		}

		if (type === 'DIRECT') {
			const chat = await this.prisma.chat.findFirst({
				where: {
					type: 'DIRECT',
					participants: {
						some: { id: participantIds[0] },
					},
					AND: {
						participants: {
							some: { id: participantIds[1] },
						},
					},
				},
				include: {
					participants: true,
				},
			})

			if (chat && chat.participants.length === 2) {
				throw new BadRequestException('Chat already exists')
			}
		}

		if (type === 'PROJECT') {
			const chat = await this.prisma.chat.findFirst({
				where: {
					type: 'PROJECT',
					projectId,
				},
			})

			if (chat) {
				throw new BadRequestException('Chat already exists')
			}
		}

		const chat = await this.prisma.chat.create({
			data: {
				type,
				participants: {
					connect: participantIds.map((id) => ({ id })),
				},
				...(type === 'PROJECT' && { projectId }),
			},
		})

		return chat
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
