import { Injectable } from '@nestjs/common'
import { NotificationType } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class NotificationsService {
	constructor(private readonly prisma: PrismaService) {}

	async create(userId: string, type: NotificationType, content: string) {
		return this.prisma.notification.create({
			data: {
				userId,
				type,
				content,
			},
		})
	}

	async getForUser(userId: string) {
		return this.prisma.notification.findMany({
			where: { userId },
			orderBy: { createdAt: 'desc' },
			take: 10,
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
