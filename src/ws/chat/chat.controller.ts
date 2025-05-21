import {
	Controller,
	Delete,
	Get,
	Param,
	ParseUUIDPipe,
	Query,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { GetMessagesDto } from '../dto/chat.dto'
import { ChatService } from './chat.service'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import {
	ApiBearerAuth,
	ApiExcludeEndpoint,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
} from '@nestjs/swagger'
import { ChatResponseDto, MessageResponseDto } from '../dto/response.dto'

@Controller('chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get all user direct chats' })
	@ApiOkResponse({ type: [ChatResponseDto] })
	@Get()
	@Auth()
	async getUserChats(@CurrentUser('id') userId: string) {
		return this.chatService.getUserDirectChats(userId)
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get all user direct chats' })
	@ApiOkResponse({ type: ChatResponseDto })
	@Get(':chatId')
	@UsePipes(new ValidationPipe())
	@Auth()
	async getChat(
		@CurrentUser('id') userId: string,
		@Param('chatId', ParseUUIDPipe) chatId: string,
	) {
		return this.chatService.getUserChat(userId, chatId)
	}

	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get all user messages from chat' })
	@ApiOkResponse({ type: [MessageResponseDto] })
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

	@ApiExcludeEndpoint()
	@Delete(':chatId')
	@UsePipes(new ValidationPipe())
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	@Auth()
	async deleteChat(@Param('chatId', ParseUUIDPipe) chatId: string) {
		return this.chatService.deleteChat(chatId)
	}
}
