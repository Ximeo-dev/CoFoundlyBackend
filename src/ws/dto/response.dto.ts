import { ChatType, Message } from '@prisma/client'
import { ChatParticipant } from '../types/chat.types'
import { Expose } from 'class-transformer'

export class ChatResponseDto {
	@Expose()
	id: string

	@Expose()
	type: ChatType

	@Expose()
	participants: ChatParticipant[]

	@Expose()
	messages: Message[]

	@Expose()
	unreadMessages: number
}
