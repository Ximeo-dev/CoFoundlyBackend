import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { instanceToPlain, plainToClass } from 'class-transformer'
import { PrismaService } from 'src/prisma/prisma.service'
import { calculateAge } from 'src/utils/calculate-age'
import {
	CreateUserProfileDto,
	UpdateUserProfileDto,
	UserProfileResponseDto,
} from './dto/user-profile.dto'
import { RelationService } from './relation.service'

@Injectable()
export class UserProfileService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly relationService: RelationService,
	) {}

	async getUserProfile(userId: string) {
		try {
			const profile = await this.prisma.userProfile.findUnique({
				where: { userId },
				include: {
					user: { select: { username: true, displayUsername: true } },
					job: { select: { name: true } },
					skills: { select: { name: true } },
					languages: { select: { name: true } },
					industries: { select: { name: true } },
				},
			})

			if (!profile) {
				throw new NotFoundException(
					`Profile with id ${userId} does not exist`,
				)
			}

			return this.prepareToResponse(profile, false)
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error
			}
			throw new BadRequestException('Failed to retrieve profile')
		}
	}

	async getForeignUserProfile(userId: string) {
		const profile = await this.getUserProfile(userId)
		return this.prepareToResponse(profile, true)
	}

	public prepareToResponse(profile: any, excludeBirthDate: boolean = true) {
		const age = profile.birthDate ? calculateAge(profile.birthDate) : null

		const responseData = excludeBirthDate
			? { ...profile, birthDate: undefined, age }
			: { ...profile, age }

		return plainToClass(UserProfileResponseDto, responseData, {
			excludeExtraneousValues: true,
		})
	}

	async createUserProfile(userId: string, dto: CreateUserProfileDto) {
		const userProfile = await this.prisma.userProfile.findUnique({
			where: { userId },
		})

		if (userProfile) {
			throw new BadRequestException('Profile already exists')
		}

		const jobData = await this.relationService.getOneToManyRelationData(
			dto.job,
			'job',
			'jobId',
			'create',
		)
		const skillsData = await this.relationService.getRelationData(
			dto.skills,
			'skill',
			'skills',
			'create',
		)
		const languagesData = await this.relationService.getRelationData(
			dto.languages,
			'language',
			'languages',
			'create',
		)
		const industriesData = await this.relationService.getRelationData(
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

			return this.prepareToResponse(profile, false)
		} catch (error) {
			if (error.code === 'P2002') {
				throw new BadRequestException('Profile with this userId already exists')
			}
			throw error
		}
	}

	async updateUserProfile(userId: string, dto: UpdateUserProfileDto) {
		const userProfile = await this.prisma.userProfile.findUnique({
			where: { userId },
		})

		if (!userProfile) {
			throw new BadRequestException('Profile does not exist')
		}

		const baseData = instanceToPlain(dto, {
			exposeUnsetFields: false,
		}) as Record<string, any>

		const jobUpdate = await this.relationService.getOneToManyRelationData(
			baseData['job'],
			'job',
			'job',
			'update',
		)
		const skillsUpdate = await this.relationService.getRelationData(
			baseData['skills'],
			'skill',
			'skills',
			'update',
		)
		const languagesUpdate = await this.relationService.getRelationData(
			baseData['languages'],
			'language',
			'languages',
			'update',
		)
		const industriesUpdate = await this.relationService.getRelationData(
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

			return this.prepareToResponse(updatedProfile, false)
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
					`Profile with id ${userId} does not exist`,
				)
			}
			throw error
		}
	}

	async setHasAvatar(userId: string, status: boolean) {
		try {
			await this.prisma.userProfile.update({
				where: { userId },
				data: {
					hasAvatar: status,
				},
			})
			return { userId, status }
		} catch (error) {
			if (error.code === 'P2025') {
				throw new NotFoundException(
					`Profile with id ${userId} does not exist`,
				)
			}
			throw error
		}
	}
}
