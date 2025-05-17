import {
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { randomBytes } from 'crypto'
import { GRACE_TTL, TTL_BY_2FA_ACTION } from 'src/constants/constants'
import { RedisService } from 'src/redis/redis.service'
import { TelegramService } from 'src/telegram/telegram.service'
import {
	TwoFactorAction,
	TwoFactorActionStatus,
	TwoFactorActionStatusEnum,
	TwoFactorHandleResult,
} from 'src/security/types/two-factor.types'
import { hasSecuritySettings } from 'src/user/types/user.guards'
import { UserService } from 'src/user/user.service'
import { SecurityService } from './security.service'

@Injectable()
export class TwoFactorService {
	constructor(
		private readonly securityService: SecurityService,
		private readonly userService: UserService,
		private readonly redis: RedisService,
		@Inject(forwardRef(() => TelegramService))
		private readonly telegramService: TelegramService,
	) {}

	private bind2FATokenKey(token: string) {
		return `2fa:${TwoFactorAction.BIND}:token:${token}`
	}

	private bind2FAUserIdKey(userId: string) {
		return `2fa:${TwoFactorAction.BIND}:userid:${userId}`
	}

	private action2FAKey(userId: string, action: TwoFactorAction) {
		return `2fa:${action}:${userId}`
	}

	private action2FAConfirmedKey(userId: string, action: TwoFactorAction) {
		return `2fa:confirmed:${action}:${userId}`
	}

	async issueBindToken(userId: string) {
		const action = TwoFactorAction.BIND

		const existing = await this.redis.get(this.bind2FAUserIdKey(userId))
		if (existing) return existing

		let token: string
		do {
			token = this.securityService.generateToken()
		} while (await this.redis.exists(this.bind2FATokenKey(token)))

		const ttl = TTL_BY_2FA_ACTION[action] ?? 60
		await this.redis.set(this.bind2FATokenKey(token), userId, ttl)
		await this.redis.set(this.bind2FAUserIdKey(userId), token, ttl)

		return token
	}

	async verifyBindToken(token: string): Promise<string | null> {
		const tokenKey = this.bind2FATokenKey(token)
		const userId = await this.redis.get(tokenKey)
		if (!userId) return null

		const userIdKey = this.bind2FAUserIdKey(userId)
		await this.redis.del(tokenKey)
		await this.redis.del(userIdKey)
		return userId
	}

	async issue2FAAction(userId: string, action: TwoFactorAction, ip: string) {
		const user = await this.userService.getByIdWithSecuritySettings(userId)

		if (!hasSecuritySettings(user))
			throw new NotFoundException('User not found')

		if (
			!user.securitySettings.twoFactorEnabled ||
			!user.securitySettings.telegramId
		)
			return false

		const confirmedKey = this.action2FAConfirmedKey(userId, action)

		const alreadyConfirmed = await this.redis.get(confirmedKey)
		if (alreadyConfirmed) {
			return false
		}

		const key = this.action2FAKey(userId, action)
		const ttl = TTL_BY_2FA_ACTION[action] ?? 60
		await this.redis.set(key, TwoFactorActionStatusEnum.PENDING, ttl)

		await this.telegramService.send2FAConfirmation(
			user,
			action,
			user.securitySettings.telegramId,
			ip,
		)

		return true
	}

	async confirmAction(
		userId: string,
		action: TwoFactorAction,
		type:
			| TwoFactorActionStatusEnum.CONFIRMED
			| TwoFactorActionStatusEnum.REJECTED,
	) {
		const key = this.action2FAKey(userId, action)

		const status = await this.redis.get(key)
		if (status !== TwoFactorActionStatusEnum.PENDING) {
			return false
		}

		await this.redis.set(key, type, 30)

		if (type === TwoFactorActionStatusEnum.CONFIRMED) {
			await this.redis.set(
				this.action2FAConfirmedKey(userId, action),
				'1',
				GRACE_TTL,
			)
		}

		return true
	}

	async getActionStatus(userId: string, action: TwoFactorAction) {
		const key = this.action2FAKey(userId, action)

		const status = await this.redis.get(key)
		if (!status) {
			return TwoFactorActionStatusEnum.EXPIRED
		}

		return status as TwoFactorActionStatus
	}

	async checkTelegramIdAvailable(telegramId: string) {
		const existing = await this.userService.getSettingsByTelegramId(telegramId)

		if (existing) return false

		return true
	}

	async handleBindToken(token: string) {
		const userId = await this.verifyBindToken(token)

		if (!userId) {
			return { result: TwoFactorHandleResult.TokenExpired }
		}

		const user = await this.userService.getByIdWithSecuritySettings(userId)

		if (!hasSecuritySettings(user))
			return { result: TwoFactorHandleResult.UserNotFound }

		const { securitySettings, ...rest } = user

		if (securitySettings.twoFactorEnabled) {
			return { result: TwoFactorHandleResult.AlreadyEnabled }
		}

		return {
			result: TwoFactorHandleResult.Success,
			user: rest,
		}
	}

	async confirmBind2FA(userId: string, telegramId: string) {
		const user = await this.userService.getByIdWithSecuritySettings(userId)

		if (!user || !user.securitySettings) {
			return TwoFactorHandleResult.UserNotFound
		}

		if (user.securitySettings.twoFactorEnabled)
			return TwoFactorHandleResult.AlreadyEnabled

		await this.userService.setTelegramId(userId, telegramId)
		await this.userService.set2FAStatus(userId, true)

		return TwoFactorHandleResult.Success
	}

	async handleUnbind2FA(userId: string) {
		const key = this.action2FAKey(userId, TwoFactorAction.UNBIND)
		const status = await this.redis.get(key)

		if (status !== TwoFactorActionStatusEnum.PENDING)
			return TwoFactorHandleResult.TokenExpired

		return this.unbind2FA(userId)
	}

	async unbind2FA(userId: string) {
		const user = await this.userService.getByIdWithSecuritySettings(userId)

		if (!hasSecuritySettings(user)) return TwoFactorHandleResult.UserNotFound

		await this.userService.set2FAStatus(userId, false)
		return TwoFactorHandleResult.Success
	}
}
