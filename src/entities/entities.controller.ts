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
import { AutocompleteQueryParamsDto, EntityDto } from './dto/entities.dto'
import { EnumValidationPipe } from 'src/pipes/enum-validation-pipe'
import { Entity, EntityType } from './types/entity.types'
import {
	ApiBearerAuth,
	ApiExcludeEndpoint,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
} from '@nestjs/swagger'

@Controller('entity')
@ApiBearerAuth()
export class EntitiesController {
	constructor(private readonly entitiesService: EntitiesService) {}

	@ApiOperation({ summary: 'Get entities for autocomplete' })
	@ApiOkResponse({ type: [Entity] })
	@ApiParam({ name: 'entity', enum: EntityType })
	@Get(':entity/autocomplete')
	@UsePipes(new ValidationPipe())
	@Auth()
	async autocomplete(
		@Query() dto: AutocompleteQueryParamsDto,
		@Param('entity', new EnumValidationPipe(EntityType))
		entity: EntityType,
	) {
		return this.entitiesService.findEntitiesForAutocomplete(
			dto.query,
			dto.limit,
			entity,
		)
	}

	@ApiExcludeEndpoint()
	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Post(':entity')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	@Auth()
	async create(
		@Body() dto: EntityDto,
		@Param('entity', new EnumValidationPipe(EntityType)) entity: EntityType,
	) {
		return this.entitiesService.createEntity(dto, entity)
	}

	@ApiExcludeEndpoint()
	@HttpCode(200)
	@UsePipes(new ValidationPipe())
	@Delete(':entity/:entityName')
	@UseGuards(RolesGuard)
	@Roles('ADMIN')
	@Auth()
	async delete(
		@Param('entityName') entityName: string,
		@Param('entity', new EnumValidationPipe(EntityType)) entity: EntityType,
	) {
		return this.entitiesService.deleteEntity(entityName, entity)
	}
}
