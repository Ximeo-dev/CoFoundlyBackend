import {
	Body,
	Controller,
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
	async profile(@CurrentUser('id') id: string) {
		return this.userService.getUserProfile(id)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Patch('settings/change-email')
	@Auth()
	async changeEmail(
		@CurrentUser('id') id: string,
		@Body() dto: ChangeEmailDto,
	) {
		return this.emailService.sendChangeEmailConfirmation(id, dto)
	}
}
