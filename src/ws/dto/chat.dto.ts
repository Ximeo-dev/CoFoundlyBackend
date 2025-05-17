import { Transform, Type } from 'class-transformer'
import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsNumber,
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

export class MarkReadDto {
	@IsUUID()
	chatId: string
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
	content: string
}
