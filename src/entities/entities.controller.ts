import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseEnumPipe,
	Post,
	Query,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { EntitiesService, EntityType } from './entities.service'
import { EntityDto } from './dto/entities.dto'
import { EnumValidationPipe } from 'src/pipes/enum-validation-pipe'

@Controller()
export class EntitiesController {
	constructor(private readonly entitiesService: EntitiesService) {}

	@Get(':entity/autocomplete')
	@Auth()
	async autocomplete(
		@Query('q') query: string,
		@Query('limit') limit: number,
		@Param('entity', new EnumValidationPipe(EntityType))
		entity: EntityType,
	) {
		return this.entitiesService.findEntitiesForAutocomplete(
			query,
			limit,
			entity,
		)
	}

	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Post(':entity')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	@Auth()
	async create(
		@Body() dto: EntityDto,
		@Param('entity', new ParseEnumPipe(EntityType)) entity: EntityType,
	) {
		return this.entitiesService.createEntity(dto, entity)
	}

	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Delete(':entity/:entityName')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	@Auth()
	async delete(
		@Param('entityName') entityName: string,
		@Param('entity', new ParseEnumPipe(EntityType)) entity: EntityType,
	) {
		return this.entitiesService.deleteEntity(entityName, entity)
	}
}
