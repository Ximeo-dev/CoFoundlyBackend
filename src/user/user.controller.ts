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
import { UpdateUserDto } from './dto/user.dto'
import { UserService } from './user.service'

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

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
	@Patch()
	@Auth()
	async updateUser(@CurrentUser('id') id: string, @Body() dto: UpdateUserDto) {
		return this.userService.updateUserData(id, dto)
	}
}
