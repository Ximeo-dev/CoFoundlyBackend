import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Post,
	Query,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { EntitiesService } from './entities.service'
import { EntityDto } from './dto/entities.dto'

@Controller()
export class EntitiesController {
	constructor(private readonly entitiesService: EntitiesService) {}

	//Сейчас излишне, все 500 навыков спокойно можно получить разом
	@Get('skills/autocomplete')
	@Auth()
	async skills(@Query('q') query: string, @Query('limit') limit: number) {
		return this.entitiesService.findEntitiesForAutocomplete(
			query,
			limit,
			'skill',
		)
	}

	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Post('skills')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	@Auth()
	async createSkill(@Body() dto: EntityDto) {
		return this.entitiesService.createEntity(dto, 'skill')
	}

	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Delete('skills/:skillName')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	@Auth()
	async deleteSkill(@Param('skillName') skillName: string) {
		return this.entitiesService.deleteEntity(skillName, 'skill')
	}

	@Get('jobs/autocomplete')
	@Auth()
	async jobs(@Query('q') query: string, @Query('limit') limit: number) {
		return this.entitiesService.findEntitiesForAutocomplete(query, limit, 'job')
	}
}
