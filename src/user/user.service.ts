import { Injectable } from '@nestjs/common'
import { hash } from 'argon2'
import { RegisterDto } from 'src/auth/dto/register.dto'
import { PrismaService } from 'src/prisma.service'

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async getById(id: string) {
		return this.prisma.user.findUnique({
			where: {
				id,
			},
		})
	}

	async getByEmail(email: string) {
		return this.prisma.user.findUnique({
			where: {
				email: email.toLowerCase(),
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
		})
	}
}
