import { ChatType } from '@prisma/client'
import { Expose } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import e from 'express'
import { UserProfileResponseDto } from 'src/profile/dto/user-profile.dto'

class Message {
	@ApiProperty()
	@Expose()
	id: string

	@ApiProperty()
	@Expose()
	chatId: string

	@ApiProperty()
	@Expose()
	senderId: string

	@ApiProperty()
	@Expose()
	content: string

	@ApiProperty()
	@Expose()
	sentAt: Date

	@ApiProperty()
	@Expose()
	updatedAt: Date

	@ApiProperty()
	@Expose()
	isEdited: boolean
}

class MessageSender {
	@ApiProperty()
	@Expose()
	id: string

	@ApiProperty()
	@Expose()
	displayUsername: string
}

export class ChatParticipant {
	@ApiProperty()
	@Expose()
	userId: string

	@ApiProperty()
	@Expose()
	displayUsername: string

	@ApiPropertyOptional()
	@Expose()
	profile?: UserProfileResponseDto
}

export class ChatResponseDto {
	@ApiProperty()
	@Expose()
	id: string

	@ApiProperty({ example: 'DIRECT' })
	@Expose()
	type: ChatType

	@ApiProperty({ type: [ChatParticipant] })
	@Expose()
	participants: ChatParticipant[]

	@ApiProperty({ description: 'Last message of chat', type: [Message] })
	@Expose()
	messages: Message[]

	@ApiProperty()
	@Expose()
	unreadMessages: number
}

export class ReadReceipt {
	@ApiProperty()
	@Expose()
	id: string

	@ApiProperty()
	@Expose()
	messageId: string

	@ApiProperty()
	@Expose()
	userId: string

	@ApiProperty()
	@Expose()
	readAt: Date
}

export class MessageResponseDto extends Message {
	@ApiProperty()
	sender: MessageSender
	@ApiProperty({ type: [ReadReceipt] })
	readReceipt: ReadReceipt[]
}
