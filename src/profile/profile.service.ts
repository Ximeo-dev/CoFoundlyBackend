import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { instanceToPlain, plainToClass } from 'class-transformer'
import { PrismaService } from 'src/prisma/prisma.service'
import { RedisService } from 'src/redis/redis.service'
import { UserService } from 'src/user/user.service'
import {
	CreateProfileDto,
	UpdateProfileDto,
	UserProfileResponseDto,
} from './dto/profile.dto'

type OneToManyType = 'job' | 'projectRole'
type ManyToManyType = 'skill' | 'language' | 'industry'

@Injectable()
export class ProfileService {
	constructor(
		private readonly userService: UserService,
		private readonly prisma: PrismaService,
		private readonly redis: RedisService,
	) {}

	private calculateAge(birthDate: Date) {
		const birth = new Date(birthDate)
		const today = new Date()

		let age = today.getFullYear() - birth.getFullYear()
		const m = today.getMonth() - birth.getMonth()
		if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
			age--
		}

		return age
	}

	/**
	 * Обработка связанных сущностей (many-to-many: ManyToManyType)
	 * @param data - Данные для обновления
	 * @param modelName - Имя модели Prisma (ManyToManyType)
	 * @param operation - Операция (create или update)
	 * @returns Данные для Prisma (connect или set)
	 */
	private async getRelationData(
		data: any,
		modelName: ManyToManyType,
		fieldName: string,
		operation: 'create' | 'update',
	) {
		if (data !== undefined) {
			if (data.length > 0) {
				const existingRecords = await this.prisma[modelName as string].findMany(
					{
						where: {
							name: {
								in: data,
							},
						},
						select: { id: true },
					},
				)

				if (existingRecords.length !== data.length) {
					throw new BadRequestException(`One or more ${modelName} do not exist`)
				}

				const relationType = operation === 'create' ? 'connect' : 'set'
				return {
					[fieldName]: {
						[relationType]: existingRecords.map((record) => ({
							id: record.id,
						})),
					},
				}
			} else if (operation === 'update' && data.length === 0) {
				return {
					[fieldName]: {
						set: [],
					},
				}
			}
		}
		return {}
	}

	/**
	 * Обработка связанных сущностей (one-to-many: OneToManyType)
	 * @param data - Данные для обновления
	 * @param modelName - Имя модели Prisma (OneToManyType)
	 * @param operation - Операция (create или update)
	 * @returns Данные для Prisma (connect или disconnect)
	 */
	private async getOneToManyRelationData(
		data: any,
		modelName: OneToManyType,
		operation: 'create' | 'update',
	) {
		if (data !== undefined) {
			// Если предоставлено значение (не null и не пустая строка)
			if (data && typeof data === 'string' && data.trim() !== '') {
				const existingRecord = await this.prisma[
					modelName as string
				].findUnique({
					where: {
						name: data,
					},
					select: { id: true },
				})

				if (!existingRecord) {
					throw new BadRequestException(`${modelName} ${data} does not exist`)
				}

				return {
					[modelName]: {
						connect: { id: existingRecord.id },
					},
				}
			}
			// Для update: если null или пустая строка, отключаем связь
			else if (operation === 'update') {
				console.log('disconnect')
				return {
					[modelName]: {
						disconnect: true,
					},
				}
			}
		}
		return {}
	}

	async getUserProfile(userId: string, excludeBirthDate: boolean = false) {
		try {
			const profile = await this.prisma.userProfile.findUnique({
				where: { userId },
				include: {
					job: { select: { name: true } },
					skills: { select: { name: true } },
					languages: { select: { name: true } },
					industries: { select: { name: true } },
				},
			})

			if (!profile) {
				throw new NotFoundException(
					`Profile with userId ${userId} does not exist`,
				)
			}

			const age = profile.birthDate
				? this.calculateAge(profile.birthDate)
				: null

			const responseData = excludeBirthDate
				? { ...profile, birthDate: undefined, age }
				: { ...profile, age }

			return plainToClass(UserProfileResponseDto, responseData, {
				excludeExtraneousValues: true,
			})
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error
			}
			throw new BadRequestException('Failed to retrieve profile')
		}
	}

	async getForeignUserProfile(userId: string) {
		return this.getUserProfile(userId, true)
	}

	async createUserProfile(userId: string, dto: CreateProfileDto) {
		const userProfile = await this.prisma.userProfile.findUnique({
			where: { userId },
		})

		if (userProfile) {
			throw new BadRequestException('Profile already exists')
		}

		const jobData = await this.getOneToManyRelationData(
			dto.job,
			'job',
			'create',
		)
		const skillsData = await this.getRelationData(
			dto.skills,
			'skill',
			'skills',
			'create',
		)
		const languagesData = await this.getRelationData(
			dto.languages,
			'language',
			'languages',
			'create',
		)
		const industriesData = await this.getRelationData(
			dto.industries,
			'industry',
			'industries',
			'create',
		)

		try {
			const profile = await this.prisma.userProfile.create({
				data: {
					userId,
					name: dto.name,
					birthDate: new Date(dto.birthDate),
					bio: dto.bio,
					portfolio: dto.portfolio,
					...jobData,
					...skillsData,
					...languagesData,
					...industriesData,
				},
				include: {
					job: { select: { name: true } },
					skills: { select: { name: true } },
					languages: { select: { name: true } },
					industries: { select: { name: true } },
				},
			})

			const age = profile.birthDate
				? this.calculateAge(profile.birthDate)
				: null

			return plainToClass(
				UserProfileResponseDto,
				{ ...profile, age },
				{
					excludeExtraneousValues: true,
				},
			)
		} catch (error) {
			if (error.code === 'P2002') {
				throw new BadRequestException('Profile with this userId already exists')
			}
			throw error
		}
	}

	async updateUserProfile(userId: string, dto: UpdateProfileDto) {
		const userProfile = await this.prisma.userProfile.findUnique({
			where: { userId },
		})

		if (!userProfile) {
			throw new BadRequestException('Profile does not exist')
		}

		const baseData = instanceToPlain(dto, {
			exposeUnsetFields: false,
		}) as Record<string, any>

		const jobUpdate = await this.getOneToManyRelationData(
			baseData['job'],
			'job',
			'update',
		)
		const skillsUpdate = await this.getRelationData(
			baseData['skills'],
			'skill',
			'skills',
			'update',
		)
		const languagesUpdate = await this.getRelationData(
			baseData['languages'],
			'language',
			'languages',
			'update',
		)
		const industriesUpdate = await this.getRelationData(
			baseData['industries'],
			'industry',
			'industries',
			'update',
		)

		delete baseData.job
		delete baseData.skills
		delete baseData.languages
		delete baseData.industries

		try {
			const updatedProfile = await this.prisma.userProfile.update({
				where: { userId },
				data: {
					...baseData,

					...jobUpdate,
					...skillsUpdate,
					...languagesUpdate,
					...industriesUpdate,
				},
				include: {
					job: { select: { name: true } },
					skills: { select: { name: true } },
					languages: { select: { name: true } },
					industries: { select: { name: true } },
				},
			})

			const age = updatedProfile.birthDate
				? this.calculateAge(updatedProfile.birthDate)
				: null

			return plainToClass(
				UserProfileResponseDto,
				{ ...updatedProfile, age },
				{
					excludeExtraneousValues: true,
				},
			)
		} catch (error) {
			if (error.code === 'P2025') {
				throw new BadRequestException('Profile not found')
			}
			throw error
		}
	}

	async deleteUserProfile(userId: string) {
		try {
			await this.prisma.userProfile.delete({
				where: { userId },
			})
			return { userId, deleted: true }
		} catch (error) {
			if (error.code === 'P2025') {
				throw new NotFoundException(
					`Profile with userId ${userId} does not exist`,
				)
			}
			throw error
		}
	}
}
