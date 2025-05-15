import {
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	isUUID,
	IsUUID,
} from 'class-validator'

export class SendMessageDto {
	@IsUUID()
	recipientId: string

	@IsString()
	@IsNotEmpty()
	content: string
}

export class GetMessagesDto {
	@IsUUID()
	chatId: string

	// @IsNumber()
	// limit: number

	// @IsOptional()
	// @IsString()
	// cursor?: string // messageId или createdAt
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
