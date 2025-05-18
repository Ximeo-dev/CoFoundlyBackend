import { Type } from 'class-transformer'
import {
	ArrayNotEmpty,
	IsArray,
	IsInt,
	IsOptional,
	IsUUID,
	Max,
	Min,
} from 'class-validator'

export class MarkReadNotificationDto {
	@IsArray()
	@ArrayNotEmpty()
	@IsUUID('all', { each: true })
	notificationIds: string[]
}

export class GetNotificationsDto {
	@IsInt()
	@Min(1)
	@IsOptional()
	@Type(() => Number)
	page: number = 1

	@IsInt()
	@Min(1)
	@Max(10)
	@IsOptional()
	@Type(() => Number)
	limit: number = 10
}
