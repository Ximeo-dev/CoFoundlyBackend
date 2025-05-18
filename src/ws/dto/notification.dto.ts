import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator'

export class MarkReadNotificationDto {
	@IsArray()
	@ArrayNotEmpty()
	@IsUUID('all', { each: true })
	notificationIds: string[]
}
