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

	async getUserProfile(userId: string, excludeBirthDate: boolean = false) {
		try {
			const profile = await this.prisma.userProfile.findUnique({
				where: { userId },
				include: {
					skills: true
				}
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

		// Обработка навыков
		let skillsConnect = {}
		if (dto.skills?.length > 0) {
			const existingSkills = await this.prisma.skill.findMany({
				where: {
					id: {
						in: dto.skills,
					},
				},
				select: { id: true },
			})

			// Проверка, что все навыки существуют
			if (existingSkills.length !== dto.skills.length) {
				throw new BadRequestException('One or more skills do not exist')
			}

			skillsConnect = {
				skills: {
					connect: existingSkills,
				},
			}
		}

		try {
			const profile = await this.prisma.userProfile.create({
				data: {
					userId,
					name: dto.name,
					birthDate: new Date(dto.birthDate),
					bio: dto.bio,
					job: dto.job,
					portfolio: dto.portfolio,
					languages: dto.languages,
					...skillsConnect,
				},
				include: {
					skills: {
						select: { id: true, name: true },
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

		// Обработка навыков
		let skillsUpdate = {}
		if (baseData.skills?.length > 0) {
			const existingSkills = await this.prisma.skill.findMany({
				where: {
					id: {
						in: baseData.skills,
					},
				},
				select: { id: true },
			})

			if (existingSkills.length !== baseData.skills.length) {
				throw new BadRequestException('One or more skills do not exist')
			}

			skillsUpdate = {
				skills: {
					set: existingSkills,
				},
			}
		} else if (baseData.skills?.length === 0) {
			skillsUpdate = {
				skills: {
					set: [],
				},
			}
		}

		// Удаляем skills из baseData, чтобы избежать конфликта
		delete baseData.skills

		try {
			const updatedProfile = await this.prisma.userProfile.update({
				where: { userId },
				data: {
					...baseData,
					...skillsUpdate,
				},
				include: {
					skills: {
						select: { id: true, name: true },
					},
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

	async setUserAvatar(id: string, avatarUrl: string | null) {
		await this.prisma.userProfile.update({
			where: { userId: id },
			data: {
				avatarUrl,
			},
		})
	}
}
