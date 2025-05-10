import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { CreateProfileDto, UpdateProfileDto } from './dto/user-profile.dto'
import { UserProfileService } from './user-profile.service'

@Controller('profile/user')
export class UserProfileController {
	constructor(private readonly userProfileService: UserProfileService) {}

	@Get()
	@Auth()
	async getProfile(@CurrentUser('id') id: string) {
		return this.userProfileService.getUserProfile(id)
	}

	@Get(':id')
	@Auth()
	async getForeignProfile(@Param('id', ParseUUIDPipe) id: string) {
		return this.userProfileService.getForeignUserProfile(id)
	}

	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Post()
	@Auth()
	async createProfile(
		@CurrentUser('id') id: string,
		@Body() dto: CreateProfileDto,
	) {
		return this.userProfileService.createUserProfile(id, dto)
	}

	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Patch()
	@Auth()
	async updateProfile(
		@CurrentUser('id') id: string,
		@Body() dto: UpdateProfileDto,
	) {
		return this.userProfileService.updateUserProfile(id, dto)
	}

	@HttpCode(200)
	@Delete()
	@Auth()
	async deleteProfile(@CurrentUser('id') id: string) {
		return this.userProfileService.deleteUserProfile(id)
	}
}
