import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common'
import {
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets'
import { Server } from 'socket.io'
import { WsExceptionFilter } from 'src/exceptions/WsExceptionFilter'
import {
	NotificationClientEvent,
	NotificationServerEvent,
} from '../types/events'
import { MarkReadNotificationDto } from '../dto/notification.dto'
import { WSCurrentUser } from 'src/auth/decorators/ws-user.decorator'
import { NotificationsService } from './notifications.service'

@WebSocketGateway({
	namespace: '/',
})
@UseFilters(WsExceptionFilter)
export class NotificationsGateway {
	@WebSocketServer() server: Server

	constructor(private readonly notificationsService: NotificationsService) {}

	// @SubscribeMessage(NotificationClientEvent.MARK_READ)
	@UsePipes(new ValidationPipe())
	async onMarkRead(
		@WSCurrentUser('id') userId: string,
		@MessageBody() dto: MarkReadNotificationDto,
	) {
		const notifications = await this.notificationsService.markAsRead(
			userId,
			dto.notificationIds,
		)

		return notifications
	}
}
