import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { UserService } from 'src/user/user.service'
import { CreateProfileDto } from './dto/profile.dto'

@Injectable()
export class ProfileService {
	constructor(
		private readonly userService: UserService,
		private readonly prisma: PrismaService,
	) {}

	async getUserProfile(userId: string) {
		return this.prisma.profile.findUnique({
			where: { userId },
		})
	}

	async createUserProfile(userId: string, dto: CreateProfileDto) {
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
}
