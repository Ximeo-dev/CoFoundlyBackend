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

@Controller('profile/project')
export class ProjectProfileController {
	constructor(private readonly projectProfileService: ProjectProfileService) {}
}
