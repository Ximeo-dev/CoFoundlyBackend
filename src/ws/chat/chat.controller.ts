import {
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
	Query,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { GetMessagesDto } from '../dto/chat.dto'
import { ChatService } from './chat.service'

@Controller('chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Get()
	@Auth()
	async getUserChats(@CurrentUser('id') userId: string) {
		return this.chatService.getUserDirectChats(userId)
	}

	@Get(':chatId/messages')
	@UsePipes(new ValidationPipe())
	@Auth()
	async getMessages(
		@CurrentUser('id') userId: string,
		@Param('chatId', ParseUUIDPipe) chatId: string,
		@Query() dto: GetMessagesDto,
	) {
		return this.chatService.getMessages(userId, chatId, dto)
	}
}
