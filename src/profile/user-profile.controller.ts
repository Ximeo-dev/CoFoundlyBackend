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
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
} from '@nestjs/swagger'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { Require2FA } from 'src/security/decorators/two-factor.decorator'
import { TwoFactorGuard } from 'src/security/guards/two-factor.guard'
import { TwoFactorAction } from 'src/security/types/two-factor.types'
import {
	CreateUserProfileDto,
	UpdateUserProfileDto,
	UserProfileResponseDto,
	UserProfileWithoutBirthDateResponseDto,
} from './dto/user-profile.dto'
import { UserProfileService } from './user-profile.service'

@Controller('profile/user')
@ApiBearerAuth()
export class UserProfileController {
	constructor(private readonly userProfileService: UserProfileService) {}

	@ApiOperation({ summary: 'Get user profile' })
	@ApiOkResponse({ type: UserProfileResponseDto })
	@Get()
	@Auth()
	async getProfile(@CurrentUser('id') id: string) {
		return this.userProfileService.getUserProfile(id)
	}

	@ApiOperation({ summary: 'Get foreign user profile' })
	@ApiOkResponse({ type: UserProfileWithoutBirthDateResponseDto })
	@Get(':id')
	@Auth()
	async getForeignProfile(@Param('id', ParseUUIDPipe) id: string) {
		return this.userProfileService.getForeignUserProfile(id)
	}

	@ApiOperation({ summary: 'Create user profile' })
	@ApiOkResponse({ type: UserProfileResponseDto })
	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Post()
	@Auth()
	async createProfile(
		@CurrentUser('id') id: string,
		@Body() dto: CreateUserProfileDto,
	) {
		return this.userProfileService.createUserProfile(id, dto)
	}

	@ApiOperation({ summary: 'Update user profile' })
	@ApiOkResponse({ type: UserProfileResponseDto })
	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Patch()
	@Auth()
	async updateProfile(
		@CurrentUser('id') id: string,
		@Body() dto: UpdateUserProfileDto,
	) {
		return this.userProfileService.updateUserProfile(id, dto)
	}

	@ApiOperation({
		summary: 'Delete user profile',
		description: 'Delete user profile with 2FA confirmation if bind',
	})
	@ApiOkResponse({
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string' },
				deleted: { type: 'boolean' },
			},
		},
	})
	@ApiForbiddenResponse({ description: '2FA confirmation required' })
	@HttpCode(200)
	@Delete()
	@Require2FA(TwoFactorAction.DELETE_PROFILE)
	@UseGuards(TwoFactorGuard)
	@Auth()
	async deleteProfile(@CurrentUser('id') id: string) {
		return this.userProfileService.deleteUserProfile(id)
	}
}
