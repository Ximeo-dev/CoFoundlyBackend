import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from '../user.service'
import { PrismaService } from '../../prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'
import { UserRole } from '@prisma/client'

describe('UserService', () => {
	let service: UserService
	let prisma: PrismaService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: PrismaService,
					useValue: {
						user: {
							findUnique: jest.fn(),
						},
					},
				},
			],
		}).compile()

		service = module.get<UserService>(UserService)
		prisma = module.get<PrismaService>(PrismaService)
	})

	describe('getUserData', () => {
		it('should return user data if user exists', async () => {
			const mockUser = {
				id: '123',
				email: 'test@example.com',
				username: 'test',
				displayUsername: 'Test',
				role: UserRole.USER,
				createdAt: new Date(),
				updatedAt: new Date(),
				securitySettings: {
					isEmailConfirmed: true,
					twoFactorEnabled: false,
					telegramId: '123456',
				},
			}

			jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser)

			const result = await service.getUserData('123')

			expect(result).toEqual(
				expect.objectContaining({
					id: mockUser.id,
					email: mockUser.email,
					username: mockUser.username,
					displayUsername: mockUser.displayUsername,
				}),
			)
		})

		it('should throw NotFoundException if user does not exist', async () => {
			jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null)

			await expect(service.getUserData('123')).rejects.toThrow(
				NotFoundException,
			)
		})
	})
})
