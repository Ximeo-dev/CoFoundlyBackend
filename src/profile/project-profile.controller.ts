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
import { ProjectProfileService } from './project-profile.service'
import { CreateProjectDto, UpdateProjectDto } from './dto/project-profile.dto'

@Controller('profile/project')
export class ProjectProfileController {
	constructor(private readonly projectProfileService: ProjectProfileService) {}

	@Get()
	@Auth()
	async getUserProjects(@CurrentUser('id') id: string) {
		return this.projectProfileService.getUserProjects(id)
	}

	@Get(':projectId')
	@Auth()
	async getProject(@Param('projectId', ParseUUIDPipe) id: string) {
		return this.projectProfileService.getProjectById(id)
	}

	@Get(':projectId/members')
	@Auth()
	async getProjectMembers(@Param('projectId', ParseUUIDPipe) id: string) {
		return this.projectProfileService.getProjectMembers(id)
	}

	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Post()
	@Auth()
	async createProfile(
		@CurrentUser('id') id: string,
		@Body() dto: CreateProjectDto,
	) {
		return this.projectProfileService.createProject(id, dto)
	}

	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Patch(':projectId')
	@Auth()
	async updateProfile(
		@CurrentUser('id') userId: string,
		@Param('projectId', new ParseUUIDPipe()) projectId: string,
		@Body() dto: UpdateProjectDto,
	) {
		return this.projectProfileService.updateProject(userId, projectId, dto)
	}

	@HttpCode(200)
	@Delete(':projectId')
	@Auth()
	async deleteProject(
		@CurrentUser('id') userId: string,
		@Param('projectId', new ParseUUIDPipe()) projectId: string,
	) {
		return this.projectProfileService.deleteProject(userId, projectId)
	}
}
