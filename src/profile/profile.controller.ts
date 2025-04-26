import {
	Body,
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { ProfileService } from './profile.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto'

@Controller('profile')
export class ProfileController {
	constructor(private readonly profileService: ProfileService) {}

	@Get()
	@Auth()
	async getProfile(@CurrentUser('id') id: string) {
		return this.profileService.getUserProfile(id)
	}

	@Get(':id')
	@Auth()
	async getForeignProfile(@Param('id', new ParseUUIDPipe()) id: string) {
		return this.profileService.getUserProfile(id)
	}

	@UsePipes(new ValidationPipe())
	@Post()
	@Auth()
	async createProfile(
		@CurrentUser('id') id: string,
		@Body() dto: CreateProfileDto,
	) {
		return this.profileService.createUserProfile(id, dto)
	}

	@UsePipes(new ValidationPipe())
	@Patch()
	@Auth()
	async updateProfile(
		@CurrentUser('id') id: string,
		@Body() dto: UpdateProfileDto,
	) {
		return this.profileService.updateUserProfile(id, dto)
	}
}
