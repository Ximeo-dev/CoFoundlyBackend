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
import { SkillsService } from './skills.service'
import { SkillDto } from './dto/skills.dto'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Auth } from 'src/auth/decorators/auth.decorator'

@Controller('skills')
export class SkillsController {
	constructor(private readonly skillsService: SkillsService) {}

	//Сейчас излишне, все 500 навыков спокойно можно получить разом
	@Get('autocomplete')
	@Auth()
	async autocomplete(@Query('q') query: string, @Query('limit') limit: number) {
		return this.skillsService.findSkillsForAutocomplete(query, limit)
	}

	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Post()
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	@Auth()
	async createSkill(@Body() dto: SkillDto) {
		return this.skillsService.createSkill(dto)
	}

	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Delete(':skillId')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	@Auth()
	async deleteSkill(@Param('skillId') skillId: string) {
		return this.skillsService.deleteSkill(skillId)
	}
}
