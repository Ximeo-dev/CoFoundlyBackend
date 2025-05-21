import { IsEnum, IsUUID } from 'class-validator'
import { SwipeAction } from '../types/swipe.types'
import { ApiProperty } from '@nestjs/swagger'

export class SwipeDto {
	@ApiProperty()
	@IsUUID()
	toUserId: string

	@ApiProperty({ enum: SwipeAction })
	@IsEnum(SwipeAction)
	action: SwipeAction
}
