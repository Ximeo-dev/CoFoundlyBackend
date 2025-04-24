import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { hash, verify } from 'argon2'
import { RegisterDto } from 'src/auth/dto/register.dto'
import { PrismaService } from 'src/prisma.service'

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

		const { role, updatedAt, ...data } = user

		return data
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
