import { Injectable, Logger } from '@nestjs/common'
import { NotificationType } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { GetNotificationsDto } from '../dto/notification.dto'

@Injectable()
export class NotificationsService {
	private logger: Logger = new Logger(NotificationsService.name)

	constructor(private readonly prisma: PrismaService) {}

	async create(recipientIds: string[], type: NotificationType) {
		let content: string

		switch (type) {
			case NotificationType.MESSAGE:
				content = 'Новое сообщение'
				break
			case NotificationType.MATCH:
				content = 'Новый мэтч'
				break
			case NotificationType.INVITE:
				content = 'Новое приглашение'
			default:
				content = 'Новое уведомление'
				break
		}

		try {
			await this.prisma.notification.createMany({
				data: recipientIds.map((id) => ({
					userId: id,
					type,
					content,
				})),
			})

			const notifications = await this.prisma.notification.findMany({
				where: { userId: { in: recipientIds }, type, content },
			})

			return notifications
		} catch (error) {
			this.logger.error('Failed to create notification', error)
			return []
		}
	}

	async getUserNotifications(userId: string, dto: GetNotificationsDto) {
		const { page, limit } = dto
		NotificationType
		return this.prisma.notification.findMany({
			where: { userId, isRead: false },
			orderBy: { createdAt: 'desc' },
			skip: (page - 1) * limit,
			take: limit,
		})
	}

	async markAsRead(userId: string, notificationIds: string[]) {
		await this.prisma.notification.updateMany({
			where: { userId, id: { in: notificationIds } },
			data: { isRead: true },
		})

		const notifications = await this.prisma.notification.findMany({
			where: {
				userId,
				id: { in: notificationIds },
			},
		})

		return notifications
	}
}
