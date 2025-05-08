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

	private async getRelationData(
		fieldName: string,
		dto: any,
		modelName: string,
		operation: 'create' | 'update',
	) {
		if (dto[fieldName] !== undefined) {
			if (Array.isArray(dto[fieldName]) && dto[fieldName].length > 0) {
				const existingRecords = await this.prisma[modelName].findMany({
					where: {
						name: {
							in: dto[fieldName],
						},
					},
					select: { id: true, name: true },
				})

				if (existingRecords.length !== dto[fieldName].length) {
					throw new BadRequestException(`One or more ${fieldName} do not exist`)
				}

				const relationType = operation === 'create' ? 'connect' : 'set'
				return {
					[fieldName]: {
						[relationType]: existingRecords.map((record) => ({
							id: record.id,
						})),
					},
				}
			} else if (
				operation === 'update' &&
				Array.isArray(dto[fieldName]) &&
				dto[fieldName].length === 0
			) {
				return {
					[fieldName]: {
						set: [],
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
					skills: {
						select: { name: true }
					}
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

		const skillsData = await this.getRelationData(
			'skills',
			dto,
			'skill',
			'create',
		)
		const languagesData = await this.getRelationData(
			'languages',
			dto,
			'language',
			'create',
		)
		const industriesData = await this.getRelationData(
			'industries',
			dto,
			'industry',
			'create',
		)

		try {
			const profile = await this.prisma.userProfile.create({
				data: {
					userId,
					name: dto.name,
					birthDate: new Date(dto.birthDate),
					bio: dto.bio,
					job: dto.job,
					portfolio: dto.portfolio,
					...skillsData,
					...languagesData,
					...industriesData,
				},
				include: {
					skills: {
						select: { name: true },
					},
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

		const skillsUpdate = await this.getRelationData(
			'skills',
			baseData,
			'skill',
			'update',
		)
		const languagesUpdate = await this.getRelationData(
			'languages',
			baseData,
			'language',
			'update',
		)
		const industriesUpdate = await this.getRelationData(
			'industries',
			baseData,
			'industry',
			'update',
		)

		delete baseData.skills
		delete baseData.languages
		delete baseData.industries

		try {
			const updatedProfile = await this.prisma.userProfile.update({
				where: { userId },
				data: {
					...baseData,
					...skillsUpdate,
					...languagesUpdate,
					...industriesUpdate,
				},
				include: {
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
