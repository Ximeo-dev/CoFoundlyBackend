import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { UserService } from 'src/user/user.service'
import { CreateProfileDto, UpdateProfileDto, UserProfileResponseDto } from './dto/profile.dto'
import { instanceToPlain, plainToClass } from 'class-transformer'

@Injectable()
export class ProfileService {
	constructor(
		private readonly userService: UserService,
		private readonly prisma: PrismaService,
	) {}

	async getUserProfile(userId: string) {
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
			},
		})

		return plainToClass(UserProfileResponseDto, profile, {
			excludeExtraneousValues: true,
		})
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

		return this.prisma.profile.create({
			data: {
				userId: userId,
				bio: dto.bio,
				job: dto.job,
				portfolio: dto.portfolio.join(';'),
				skills: {
					connect: existingSkills.map((skill) => ({ id: skill.id })),
				},
				timezone: dto.timezone,
			},
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

		return this.prisma.profile.update({
			where: { userId },
			data: {
				...baseData,
				...skillsData,
			},
			include: {
				skills: true,
			},
		})
	}
}
