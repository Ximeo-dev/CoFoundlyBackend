import { BadRequestException, Injectable } from '@nestjs/common'
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

	async getUserProfile(userId: string) {
		const cacheKey = `profile:${userId}`

		const cached = await this.redis.getObject<UserProfileResponseDto>(cacheKey)
		if (cached) {
			return cached
		}

		const profile = await this.prisma.profile.findUnique({
			where: { userId },
			include: {
				user: {
					select: {
						age: true,
						avatarUrl: true,
						name: true,
					},
				},
				skills: true,
			},
		})

		if (!profile) return null

		const dto = plainToClass(UserProfileResponseDto, profile, {
			excludeExtraneousValues: true,
		})

		await this.redis.setObject(cacheKey, dto, 180)

		return dto
	}

	async createUserProfile(userId: string, dto: CreateProfileDto) {
		const userProfile = await this.prisma.profile.findUnique({
			where: { userId },
		})

		if (userProfile) throw new BadRequestException('Profile already exist')

		const existingSkills = await this.prisma.skill.findMany({
			where: {
				name: {
					in: dto.skills,
				},
			},
			select: {
				id: true,
			},
		})

		const profile = await this.prisma.profile.create({
			data: {
				userId: userId,
				bio: dto.bio,
				job: dto.job,
				portfolio: dto.portfolio.join(';'),
				skills: {
					connect: existingSkills.map((skill) => ({ id: skill.id })),
				},
			},
			include: {
				user: {
					select: {
						age: true,
						avatarUrl: true,
						name: true,
					},
				},
				skills: true,
			},
		})

		return plainToClass(UserProfileResponseDto, profile, {
			excludeExtraneousValues: true,
		})
	}

	async updateUserProfile(userId: string, dto: UpdateProfileDto) {
		const userProfile = await this.prisma.profile.findUnique({
			where: { userId },
		})

		if (!userProfile) throw new BadRequestException('Profile not exist')

		const baseData =
			(instanceToPlain(dto, {
				exposeUnsetFields: false,
			}) as Record<string, any>) || {}

		if (baseData.portfolio) {
			baseData.portfolio = baseData.portfolio.join(';')
		}

		let skillsData = {}
		if (baseData.skills && baseData.skills.length > 0) {
			const existingSkills = await this.prisma.skill.findMany({
				where: {
					name: {
						in: baseData.skills,
					},
				},
				select: { id: true },
			})
			skillsData = {
				skills: {
					connect: existingSkills.map((skill) => ({ id: skill.id })),
				},
			}
			delete baseData.skills
		}

		const updatedProfile = this.prisma.profile.update({
			where: { userId },
			data: {
				...baseData,
				...skillsData,
			},
			include: {
				skills: true,
				user: {
					select: {
						name: true,
						age: true,
						avatarUrl: true,
					},
				},
			},
		})

		return plainToClass(UserProfileResponseDto, updatedProfile, {
			excludeExtraneousValues: true,
		})
	}

	async deleteUserProfile(userId: string) {
		const userProfile = await this.prisma.profile.findUnique({
			where: { userId },
		})

		if (!userProfile) throw new BadRequestException('Profile not exist')

		await this.prisma.profile.delete({
			where: { userId },
		})

		return true
	}
}
