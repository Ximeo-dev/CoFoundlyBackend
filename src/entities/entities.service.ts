import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { RedisService } from 'src/redis/redis.service'
import { EntityDto } from './dto/entities.dto'

export interface Entity {
	name: string
}

export enum EntityType {
	JOB = 'job',
	SKILL = 'skill',
	LANGUAGE = 'language',
	INDUSTRY = 'industry',
}

@Injectable()
export class EntitiesService {
	private readonly logger = new Logger(EntitiesService.name)
	private readonly CACHE_TTL = 300
	private readonly MAX_LIMIT = 40

	constructor(
		private readonly prisma: PrismaService,
		private readonly redis: RedisService,
	) {}

	getEntitiesCacheKey(entity: EntityType) {
		return `${entity}:all`
	}

	filterByQuery(entity: Entity[], query: string) {
		return entity
			.filter((skill) => skill.name.toLowerCase().includes(query))
			.sort((a, b) => {
				const aStartsWith = a.name.toLowerCase().startsWith(query)
				const bStartsWith = b.name.toLowerCase().startsWith(query)

				// Приоритет сущностям, начинающимся с запроса
				if (aStartsWith && !bStartsWith) return -1
				if (!aStartsWith && bStartsWith) return 1

				return a.name.localeCompare(b.name)
			})
	}

	/**
	 * Получение всех записей для указанной сущности
	 * @param entity - Имя сущности (EntityType)
	 * @returns Список записей с name, отсортированных по популярности и имени
	 */
	async getAll(entity: EntityType): Promise<Entity[]> {
		return this.prisma[entity as string].findMany({
			select: {
				name: true,
			},
			orderBy: [{ profiles: { _count: 'desc' } }, { name: 'asc' }],
		})
	}

	async findEntitiesForAutocomplete(
		query: string,
		limit: number,
		entity: EntityType,
	) {
		const trimmedQuery = query.trim().toLowerCase()
		// limit = Math.min(limit, this.MAX_LIMIT)
		const cacheKey = this.getEntitiesCacheKey(entity)

		let entities = await this.redis.getObject<Entity[]>(cacheKey)

		if (!entities) {
			entities = await this.getAll(entity)
			try {
				await this.redis.setObject(cacheKey, entities, this.CACHE_TTL)
			} catch (error) {
				this.logger.error(`Failed to cache entities to Redis: ${error.message}`)
			}
		}

		if (!trimmedQuery) {
			return entities.slice(0, limit)
		}

		const filteredEntities = this.filterByQuery(entities, query)

		return filteredEntities.slice(0, limit)
	}

	/**
	 * Создание новой записи
	 * @param name - Название записи
	 * @param entity - Имя сущности (EntityType)
	 * @returns Созданная запись
	 */
	async createEntity(dto: EntityDto, entity: EntityType) {
		try {
			const createdEntity: Entity = await this.prisma[entity as string].create({
				data: {
					name: dto.name,
				},
				select: {
					name: true,
				},
			})

			const cacheKey = this.getEntitiesCacheKey(entity)

			try {
				const entities = await this.redis.getObject<Entity[]>(cacheKey)
				if (entities) {
					entities.push(createdEntity)
					await this.redis.setObject(cacheKey, entities, this.CACHE_TTL)
				}
			} catch (error) {
				this.logger.error(
					`Failed to update cache after creating ${entity}: ${error.message}`,
				)
			}

			return createdEntity
		} catch (error) {
			if (error.code === 'P2002') {
				throw new BadRequestException(
					`${entity} with name ${dto.name} already exists`,
				)
			}
			throw error
		}
	}

	/**
	 * Создание новой записи
	 * @param name - Название записи
	 * @param entity - Имя сущности (EntityType)
	 * @returns Созданная запись
	 */
	async deleteEntity(entityName: string, entity: EntityType) {
		try {
			const deletedEntity = await this.prisma[entity as string].delete({
				where: { name: entityName },
				select: {
					name: true,
				},
			})

			const cacheKey = this.getEntitiesCacheKey(entity)

			try {
				const entities = await this.redis.getObject<Entity[]>(cacheKey)
				if (entities) {
					const updatedEntities = entities.filter((e) => e.name !== entityName)
					await this.redis.setObject(cacheKey, updatedEntities, this.CACHE_TTL)
				}
			} catch (error) {
				this.logger.error(
					`Failed to update cache after deleting ${entity}: ${error.message}`,
				)
			}

			return deletedEntity
		} catch (error) {
			if (error.code === 'P2025') {
				throw new NotFoundException(`${entity} ${entityName} not found`)
			}
			throw error
		}
	}
}
