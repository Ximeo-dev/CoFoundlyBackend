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

	async getUserProfile(userId: string) {
		const profile = await this.prisma.userProfile.findUnique({
			where: { userId },
			include: {
				skills: true,
			},
		})

		if (!profile) return null

		const age = this.calculateAge(profile.birthDate)

		const dto = plainToClass(UserProfileResponseDto, { ...profile, age }, {
			excludeExtraneousValues: true,
		})

		return dto
	}

	async getForeignUserProfile(userId: string) {
		const profile = await this.prisma.userProfile.findUnique({
			where: { userId },
			include: {
				skills: true,
			},
		})

		if (!profile) return null

		const { birthDate, ...rest } = profile

		const age = this.calculateAge(birthDate)

		const dto = plainToClass(UserProfileResponseDto, { ...rest, age }, {
			excludeExtraneousValues: true,
		})

		return dto
	}

	async createUserProfile(userId: string, dto: CreateProfileDto) {
		const userProfile = await this.prisma.userProfile.findUnique({
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

		const profile = await this.prisma.userProfile.create({
			data: {
				userId: userId,
				name: dto.name,
				birthDate: dto.birthDate,
				// city: ,
				// country: ,
				// timezone: ,
				bio: dto.bio,
				job: dto.job,
				portfolio: dto.portfolio,
				languages: dto.languages,
				skills: {
					connect: existingSkills.map((skill) => ({ id: skill.id })),
				},
			},
			include: {
				skills: true,
			},
		})

		const age = this.calculateAge(profile.birthDate)

		return plainToClass(UserProfileResponseDto, { ...profile, age }, {
			excludeExtraneousValues: true,
		})
	}

	async updateUserProfile(userId: string, dto: UpdateProfileDto) {
		const userProfile = await this.prisma.userProfile.findUnique({
			where: { userId },
		})

		if (!userProfile) throw new BadRequestException('Profile not exist')

		const baseData =
			(instanceToPlain(dto, {
				exposeUnsetFields: false,
			}) as Record<string, any>) || {}

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

		const updatedProfile = await this.prisma.userProfile.update({
			where: { userId },
			data: {
				...baseData,
				...skillsData,
			},
			include: {
				skills: true,
			},
		})

		const age = this.calculateAge(updatedProfile.birthDate)

		return plainToClass(UserProfileResponseDto, {...updatedProfile, age}, {
			excludeExtraneousValues: true,
		})
	}

	async deleteUserProfile(userId: string) {
		const userProfile = await this.prisma.userProfile.findUnique({
			where: { userId },
		})

		if (!userProfile) throw new BadRequestException('Profile not exist')

		await this.prisma.userProfile.delete({
			where: { userId },
		})

		return true
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
