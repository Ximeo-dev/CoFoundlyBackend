import { Test, TestingModule } from '@nestjs/testing'
import { UserController } from '../user.controller'
import { UserService } from '../user.service'
import { UserResponseDto } from '../dto/user.dto'

describe('UserController', () => {
	let controller: UserController
	let userService: UserService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			providers: [
				{
					provide: UserService,
					useValue: {
						getUserData: jest.fn(),
					},
				},
			],
		}).compile()

		controller = module.get<UserController>(UserController)
		userService = module.get<UserService>(UserService)
	})

	describe('getUser', () => {
		it('should return user data', async () => {
			const mockUser: UserResponseDto = {
				id: '1',
				username: 'john',
				displayUsername: 'John',
				email: 'john@example.com',
				createdAt: new Date(),
				securitySettings: {
					isEmailConfirmed: true,
					twoFactorEnabled: false,
					telegramId: null,
				},
			}

			jest.spyOn(userService, 'getUserData').mockResolvedValue(mockUser)

			const result = await controller.getUser('1')

			expect(result).toEqual(mockUser)
			expect(userService.getUserData).toHaveBeenCalledWith('1')
		})
	})
})
