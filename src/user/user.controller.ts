import {
	Body,
	Controller,
	Delete,
	Get,
	Patch,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { UserService } from './user.service'

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get()
	@Auth()
	async getUser(@CurrentUser('id') id: string) {
		return this.userService.getUserData(id)
	}
}
