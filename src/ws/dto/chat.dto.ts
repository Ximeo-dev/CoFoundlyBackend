import { Type } from 'class-transformer'
import {
	ArrayNotEmpty,
	IsArray,
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	Min,
} from 'class-validator'

export class SendMessageDto {
	@IsUUID()
	chatId: string

	@IsString()
	@IsNotEmpty()
	content: string
}

export class GetMessagesDto {
	@IsInt()
	@Min(1)
	@IsOptional()
	@Type(() => Number)
	page: number = 1

	@IsInt()
	@Min(1)
	@Max(30)
	@IsOptional()
	@Type(() => Number)
	limit: number = 30
}

export class MarkReadMessageDto {
	@IsUUID()
	chatId: string

	@IsArray()
	@ArrayNotEmpty()
	@IsUUID('all', { each: true })
	messageIds: string[]
}

export class UserTypingDto {
	@IsUUID()
	chatId: string

	@IsBoolean()
	isTyping: boolean
}

export class DeleteMessageDto {
	@IsUUID()
	chatId: string

	@IsUUID()
	messageId: string
}

export class MessageEditDto {
	@IsUUID()
	chatId: string

	@IsUUID()
	messageId: string

	@IsString()
	@IsNotEmpty()
	newContent: string
}
