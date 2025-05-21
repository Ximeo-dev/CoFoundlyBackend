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
	CreateProjectDto,
	ProjectMember,
	ProjectResponseDto,
	ProjectWithoutOwnerResponseDto,
	UpdateProjectDto,
} from './dto/project-profile.dto'
import { ProjectProfileService } from './project-profile.service'

@Controller('profile/project')
@ApiBearerAuth()
export class ProjectProfileController {
	constructor(private readonly projectProfileService: ProjectProfileService) {}

	@ApiOperation({
		summary: 'Get user projects',
		description: 'Get projects where user is owner or member',
	})
	@ApiOkResponse({ type: ProjectResponseDto })
	@Get()
	@Auth()
	async getUserProjects(@CurrentUser('id') id: string) {
		return this.projectProfileService.getUserProjects(id)
	}

	@ApiOperation({
		summary: 'Get project by ID',
		description: 'Get project info without project owner',
	})
	@ApiOkResponse({ type: ProjectWithoutOwnerResponseDto })
	@Get(':projectId')
	@Auth()
	async getProject(@Param('projectId', ParseUUIDPipe) id: string) {
		return this.projectProfileService.getProjectById(id)
	}

	@ApiOperation({ summary: 'Get project members by project ID' })
	@ApiOkResponse({ type: [ProjectMember] })
	@Get(':projectId/members')
	@Auth()
	async getProjectMembers(@Param('projectId', ParseUUIDPipe) id: string) {
		return this.projectProfileService.getProjectMembers(id)
	}

	@ApiOperation({ summary: 'Create project' })
	@ApiOkResponse({ type: [ProjectResponseDto] })
	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Post()
	@Auth()
	async createProject(
		@CurrentUser('id') id: string,
		@Body() dto: CreateProjectDto,
	) {
		return this.projectProfileService.createProject(id, dto)
	}

	@ApiOperation({ summary: 'Update project' })
	@ApiOkResponse({ type: [ProjectResponseDto] })
	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Patch(':projectId')
	@Auth()
	async updateProject(
		@CurrentUser('id') userId: string,
		@Param('projectId', new ParseUUIDPipe()) projectId: string,
		@Body() dto: UpdateProjectDto,
	) {
		return this.projectProfileService.updateProject(userId, projectId, dto)
	}

	@ApiOperation({
		summary: 'Delete project',
		description: 'Delete project with 2FA confirmation if bind',
	})
	@ApiOkResponse({
		schema: {
			type: 'object',
			properties: {
				projectId: { type: 'string' },
				deleted: { type: 'boolean' },
			},
		},
	})
	@ApiForbiddenResponse({ description: '2FA confirmation required' })
	@HttpCode(200)
	@Delete(':projectId')
	@Require2FA(TwoFactorAction.DELETE_PROJECT)
	@UseGuards(TwoFactorGuard)
	@Auth()
	async deleteProject(
		@CurrentUser('id') userId: string,
		@Param('projectId', new ParseUUIDPipe()) projectId: string,
	) {
		return this.projectProfileService.deleteProject(userId, projectId)
	}
}
