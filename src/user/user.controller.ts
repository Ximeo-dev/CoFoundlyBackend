import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Patch,
	Put,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { UserService } from './user.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { ChangeEmailDto } from './dto/user.dto'
import { EmailService } from 'src/email/email.service'

@Controller('user')
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly emailService: EmailService,
	) {}

	@Get()
	@Auth()
	async createUser(@CurrentUser('id') id: string) {
		return this.userService.getUserData(id)
	}


	// Отложено до нормальной 2FA
	@Delete()
	@Auth()
	async deleteUser(@CurrentUser('id') id: string) {
		return this.userService.delete(id)
	}

	@UsePipes(new ValidationPipe())
	@Patch('settings/change-email')
	@Auth()
	async changeEmail(
		@CurrentUser('id') id: string,
		@Body() dto: ChangeEmailDto,
	) {
		return this.emailService.sendChangeEmailConfirmation(id, dto)
	}
}
