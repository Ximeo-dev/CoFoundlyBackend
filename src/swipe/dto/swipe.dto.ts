import { IsEnum, IsUUID } from 'class-validator'
import { SwipeAction } from '../types/swipe.types'

export class SwipeDto {
	@IsUUID()
	toUserId: string

	@IsEnum(SwipeAction)
	action: SwipeAction
}
