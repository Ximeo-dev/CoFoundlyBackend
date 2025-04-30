import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { hash } from 'argon2'
import {
	instanceToPlain,
	plainToClass,
	plainToInstance,
} from 'class-transformer'
import { RegisterDto } from 'src/auth/dto/register.dto'
import { PrismaService } from 'src/prisma.service'
import { UpdateUserDto, UserResponseDto } from './dto/user.dto'

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) {}

	async getById(id: string) {
		return this.prisma.user.findUnique({
			where: {
				id,
			},
		})
	}

	async getByIdWithSecuritySettings(id: string) {
		return this.prisma.user.findUnique({
			where: {
				id,
			},
			include: { securitySettings: true },
		})
	}

	async getByEmail(email: string) {
		return this.prisma.user.findUnique({
			where: {
				email: email.toLowerCase(),
			},
		})
	}

	async getByEmailWithSecuritySettings(email: string) {
		return this.prisma.user.findUnique({
			where: {
				email: email.toLowerCase(),
			},
			include: { securitySettings: true },
		})
	}

	async getUserSecuritySettingsById(userId: string) {
		return this.prisma.securitySettings.findUnique({
			where: {
				userId,
			},
		})
	}

	async create(dto: RegisterDto) {
		const passwordHash = await hash(dto.password)

		return this.prisma.user.create({
			data: {
				email: dto.email.toLowerCase(),
				name: dto.name,
				securitySettings: passwordHash
					? {
							create: {
								passwordHash: passwordHash,
							},
						}
					: undefined,
			},
			include: {
				securitySettings: true,
			},
		})
	}

	async delete(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		})

		if (!user) throw new BadRequestException('User not exist')

		await this.prisma.$transaction([
			this.prisma.profile.deleteMany({ where: { userId: userId } }),
			this.prisma.securitySettings.deleteMany({ where: { userId: userId } }),
			this.prisma.user.delete({ where: { id: userId } }),
		])

		return true
	}

	async getUserData(id: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				id,
			},
			include: {
				securitySettings: {
					select: {
						isEmailConfirmed: true,
						twoFactorEnabled: true,
						telegramId: true,
					},
				},
			},
		})

		if (!user) throw new NotFoundException(`Invalid user`)

		return plainToInstance(UserResponseDto, user, {
			excludeExtraneousValues: true,
		})
	}

	async updateUserData(id: string, dto: UpdateUserDto) {
		const userData = await this.getUserData(id)

		if (!userData) throw new BadRequestException('User not exist')

		const baseData =
			(instanceToPlain(dto, {
				exposeUnsetFields: false,
			}) as Record<string, any>) || {}

		const updatedData = this.prisma.user.update({
			where: { id },
			data: {
				...baseData,
			},
		})

		return plainToClass(UserResponseDto, updatedData, {
			excludeExtraneousValues: true,
		})
	}

	async setUserAvatar(id: string, avatarUrl: string | null) {
		await this.prisma.user.update({
			where: { id },
			data: {
				avatarUrl,
			},
		})
	}

	async setEmailConfirmationToken(userId: string, token: string) {
		await this.prisma.securitySettings.update({
			where: {
				userId,
			},
			data: {
				emailConfirmationToken: token,
			},
		})
	}

	async setConfirmedEmailStatus(userId: string, status: boolean) {
		await this.prisma.securitySettings.update({
			where: {
				userId,
			},
			data: {
				isEmailConfirmed: status,
			},
		})
	}

	async setResetPasswordToken(userId: string, token: string) {
		await this.prisma.securitySettings.update({
			where: {
				userId,
			},
			data: {
				resetPasswordToken: token,
			},
		})
	}

	async setPassword(userId: string, password: string) {
		await this.prisma.securitySettings.update({
			where: { userId },
			data: { passwordHash: await hash(password) },
		})
	}

	async invalidateTokens(userId: string) {
		await this.prisma.securitySettings.update({
			where: { userId },
			data: { jwtTokenVersion: { increment: 1 } },
		})
	}

	async setChangeEmailToken(userId: string, token: string) {
		await this.prisma.securitySettings.update({
			where: {
				userId,
			},
			data: {
				changeEmailToken: token,
			},
		})
	}

	async changeEmail(userId: string, email: string) {
		await this.prisma.user.update({
			where: { id: userId },
			data: { email },
		})
	}

	async set2FAToken(userId: string, token: string | null) {
		await this.prisma.securitySettings.update({
			where: {
				userId,
			},
			data: {
				twoFactorToken: token,
			},
		})
	}

	async set2FAStatus(userId: string, status: boolean) {
		await this.prisma.securitySettings.update({
			where: {
				userId,
			},
			data: {
				twoFactorEnabled: status,
			},
		})
	}

	async setTelegramId(userId: string, telegramId: string) {
		await this.prisma.securitySettings.update({
			where: {
				userId,
			},
			data: {
				telegramId,
			},
		})
	}
}
