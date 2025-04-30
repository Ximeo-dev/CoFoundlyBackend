import {
	Body,
	Controller,
	Delete,
	Get,
	Patch,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { UserService } from './user.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { ChangeEmailDto, UpdateUserDto } from './dto/user.dto'
import { EmailService } from 'src/email/email.service'

@Controller('user')
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly emailService: EmailService,
	) {}

	@Get()
	@Auth()
	async getUser(@CurrentUser('id') id: string) {
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

	@UsePipes(new ValidationPipe())
	@Patch()
	@Auth()
	async updateUser(
		@CurrentUser('id') id: string,
		@Body() dto: UpdateUserDto,
	) {
		return this.userService.updateUserData(id, dto)
	}
}
