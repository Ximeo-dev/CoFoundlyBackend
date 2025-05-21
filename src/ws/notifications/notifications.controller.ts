import {
	Controller,
	Get,
	Query,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { GetNotificationsDto } from '../dto/notification.dto'

@Controller('notifications')
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	// @Get()
	@UsePipes(new ValidationPipe())
	@Auth()
	async getNotifications(
		@CurrentUser('id') userId: string,
		@Query() dto: GetNotificationsDto,
	) {
		return this.notificationsService.getUserNotifications(userId, dto)
	}
}
