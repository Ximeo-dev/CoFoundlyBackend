import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { SkillDto } from './dto/skills.dto'
import { RedisService } from 'src/redis/redis.service'
import { Skill } from '@prisma/client'

@Injectable()
export class SkillsService {
	private readonly logger = new Logger(SkillsService.name)
	private readonly SKILLS_CACHE_KEY = 'skills:all'
	private readonly CACHE_TTL = 600
	private readonly MAX_LIMIT = 40

	constructor(
		private readonly prisma: PrismaService,
		private readonly redis: RedisService,
	) {}

	async findSkillsForAutocomplete(query: string = '', limit: number = 10) {
		const trimmedQuery = query.trim().toLowerCase()
		// limit = Math.min(limit, this.MAX_LIMIT)

		let skills = await this.redis.getObject<Skill[]>(this.SKILLS_CACHE_KEY)

		if (!skills) {
			this.logger.debug('Cache miss, fetching skills from database')
			skills = await this.prisma.skill.findMany({
				select: { id: true, name: true },
				orderBy: { name: 'asc' },
			})
			try {
				await this.redis.setObject(
					this.SKILLS_CACHE_KEY,
					skills,
					this.CACHE_TTL,
				)
				this.logger.debug(`Cached ${skills.length} skills`)
			} catch (error) {
				this.logger.error(`Failed to cache skills to Redis: ${error.message}`)
			}
		}	

		if (!trimmedQuery) {
			return skills.slice(0, limit)
		}

		const filteredSkills = skills
			.filter((skill) => skill.name.toLowerCase().includes(trimmedQuery))
			.sort((a, b) => {
				const aStartsWith = a.name.toLowerCase().startsWith(trimmedQuery)
				const bStartsWith = b.name.toLowerCase().startsWith(trimmedQuery)

				// Приоритет навыкам, начинающимся с запроса
				if (aStartsWith && !bStartsWith) return -1
				if (!aStartsWith && bStartsWith) return 1

				return a.name.localeCompare(b.name)
			})

		return filteredSkills.slice(0, limit)
	}

	async createSkill(dto: SkillDto) {
		try {
			const skill = await this.prisma.skill.create({
				data: {
					id: dto.id,
					name: dto.name,
				},
				select: {
					id: true,
					name: true,
				},
			})

			try {
				const skills = await this.redis.getObject<Skill[]>(
					this.SKILLS_CACHE_KEY,
				)
				if (skills) {
					skills.push(skill)
					skills.sort((a, b) => a.name.localeCompare(b.name))
					await this.redis.setObject(
						this.SKILLS_CACHE_KEY,
						skills,
						this.CACHE_TTL,
					)
					this.logger.debug(`Added skill ${dto.name} to cache`)
				}
			} catch (error) {
				this.logger.error(
					`Failed to update cache after creating skill: ${error.message}`,
				)
			}

			return skill
		} catch (error) {
			if (error.code === 'P2002') {
				throw new BadRequestException(`Skill with name ${dto.name} already exists`)
			}
			throw error
		}
	}

	async deleteSkill(skillId: string) {
		try {
			const skill = await this.prisma.skill.delete({
				where: { id: skillId },
				select: {
					id: true,
					name: true,
				},
			})

			try {
				const skills = await this.redis.getObject<Skill[]>(
					this.SKILLS_CACHE_KEY,
				)
				if (skills) {
					const updatedSkills = skills.filter((s) => s.id !== skillId)
					await this.redis.setObject(
						this.SKILLS_CACHE_KEY,
						updatedSkills,
						this.CACHE_TTL,
					)
					this.logger.debug(`Removed skill ${skill.name} from cache`)
				}
			} catch (error) {
				this.logger.error(
					`Failed to update cache after deleting skill: ${error.message}`,
				)
			}

			return skill
		} catch (error) {
			if (error.code === 'P2025') {
				throw new NotFoundException(`Skill with ID ${skillId} not found`)
			}
			throw error
		}
	}
}
