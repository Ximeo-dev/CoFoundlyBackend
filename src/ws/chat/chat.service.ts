import {
	BadRequestException,
	Injectable,
	Logger,
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
import { ChatParticipant, ChatResponseDto } from '../dto/response.dto'
import { ChatType, NotificationType } from '@prisma/client'
import { RedisService } from 'src/redis/redis.service'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class ChatService {
	private logger: Logger = new Logger(ChatService.name)

	constructor(
		private readonly prisma: PrismaService,
		private readonly userProfileService: UserProfileService,
		private readonly redis: RedisService,
		private readonly notificationsService: NotificationsService,
	) {}

	private getChatMessagesCacheKey(chatId: string) {
		return `chat:${chatId}:messages`
	}

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
				messages: {
					take: 1,
					orderBy: { sentAt: 'desc' },
					include: {
						sender: { select: { id: true, displayUsername: true } },
						readReceipt: true,
					},
				},
			},
		})

		const chatIds = chats.map((chat) => chat.id)

		const unreadCounts = await this.prisma.message.groupBy({
			by: ['chatId'],
			where: {
				chatId: { in: chatIds },
				readReceipt: {
					none: {
						userId,
					},
				},
				senderId: {
					not: userId,
				},
			},
			_count: {
				id: true,
			},
		})

		const unreadMap = new Map(
			unreadCounts.map((entry) => [entry.chatId, entry._count.id]),
		)

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
				unreadMessages: unreadMap.get(chat.id) ?? 0,
			}
		})

		return response
	}

	async getUserChat(userId: string, chatId: string): Promise<ChatResponseDto> {
		const chat = await this.prisma.chat.findUnique({
			where: {
				id: chatId,
			},
			include: {
				participants: {
					select: {
						id: true,
						displayUsername: true,
					},
				},
				messages: {
					take: 1,
					orderBy: { sentAt: 'desc' },
					include: {
						sender: { select: { id: true, displayUsername: true } },
						readReceipt: true,
					},
				},
			},
		})

		if (!chat) throw new NotFoundException(`Chat with id ${chatId} not found`)

		const unreadCount = await this.prisma.message.count({
			where: {
				chatId: chatId,
				senderId: { not: userId },
				readReceipt: {
					none: {
						userId: userId,
					},
				},
			},
		})

		const participantIds = Array.from(
			new Set(
				chat.participants.filter((p) => p.id !== userId).map((p) => p.id),
			),
		)

		const profiles =
			await this.userProfileService.getForeignUsersProfiles(participantIds)
		const profileMap = new Map(
			participantIds.map((id, index) => [id, profiles[index]]),
		)

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
			unreadMessages: unreadCount ?? 0,
		}
	}

	async sendMessage(userId: string, dto: SendMessageDto) {
		const chat = await this.prisma.chat.findUnique({
			where: {
				id: dto.chatId,
			},
			include: {
				participants: {
					select: { id: true },
				},
			},
		})

		if (!chat)
			throw new NotFoundException(`Chat with id ${dto.chatId} not found`)

		const recipientIds = chat.participants
			.map((p) => p.id)
			.filter((id) => id !== userId)

		const notifications = await this.notificationsService.create(
			recipientIds,
			NotificationType.MESSAGE,
		)

		const notificationsMap = new Map(
			notifications.map((notification) => [notification.userId, notification]),
		)

		try {
			const message = await this.prisma.message.create({
				data: {
					chatId: chat.id,
					senderId: userId,
					content: dto.content,
				},
				include: {
					sender: {
						select: { id: true, displayUsername: true },
					},
				},
			})

			return { message, notificationsMap, recipientIds }
		} catch (error) {
			this.logger.error('Failed to create message', error)
			return { message: undefined, notificationsMap, recipientIds }
		}
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
		if (!chat) throw new NotFoundException('Chat not found')

		return this.prisma.message.findMany({
			where: { chatId },
			orderBy: { sentAt: 'asc' },
			skip: (page - 1) * limit,
			take: limit,
			include: {
				sender: { select: { id: true, displayUsername: true } },
				readReceipt: true,
			},
		})
	}

	async markMessagesAsRead(userId: string, messageIds: string[]) {
		if (!messageIds.length) return []

		const messagesWithReceipts = await this.prisma.message.findMany({
			where: {
				id: { in: messageIds },
			},
			select: {
				id: true,
				senderId: true,
				readReceipt: {
					where: { userId },
					select: { id: true },
				},
			},
		})

		const newReceipts = messagesWithReceipts
			.filter((msg) => msg.senderId !== userId && !msg.readReceipt.length)
			.map((msg) => ({
				messageId: msg.id,
				userId,
			}))

		if (newReceipts.length > 0) {
			await this.prisma.readReceipt.createMany({
				data: newReceipts,
				skipDuplicates: true,
			})
		}

		return this.prisma.readReceipt.findMany({
			where: {
				userId,
				messageId: {
					in: newReceipts.map((r) => r.messageId),
				},
			},
		})
	}

	async deleteMessage(userId: string, dto: DeleteMessageDto) {
		try {
			const message = await this.prisma.message.findUnique({
				where: { id: dto.messageId, chatId: dto.chatId },
			})
			if (!message) throw new NotFoundException('Message not found')
			if (message.senderId !== userId)
				throw new BadRequestException('You can only delete your own messages')
			const deletedMessage = await this.prisma.message.delete({
				where: { id: message.id, chatId: message.chatId },
			})
			return deletedMessage
		} catch (error) {
			console.error(error)
			throw new BadRequestException('Delete message failed')
		}
	}

	async editMessage(userId: string, dto: MessageEditDto) {
		const message = await this.prisma.message.findUnique({
			where: { id: dto.messageId, chatId: dto.chatId },
		})
		if (!message) throw new NotFoundException('Message not found')
		if (message.senderId !== userId)
			throw new BadRequestException('You can only edit your own messages')
		return this.prisma.message.update({
			where: { id: message.id, chatId: message.chatId },
			data: { content: dto.newContent, isEdited: true },
		})
	}

	// Только для администрации
	async deleteChat(chatId: string) {
		const chat = await this.prisma.chat.findUnique({
			where: { id: chatId },
		})
		if (!chat) throw new NotFoundException('Chat not found')

		return this.prisma.chat.delete({
			where: { id: chatId },
		})
	}
}
