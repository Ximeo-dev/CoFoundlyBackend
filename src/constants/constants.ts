import { TwoFactorAction } from 'src/two-factor/types/two-factor.types'

export const TTL_BY_ACTION: Record<TwoFactorAction, number> = {
	[TwoFactorAction.BIND]: 120,
	[TwoFactorAction.UNBIND]: 60,
	[TwoFactorAction.CHANGE_EMAIL]: 60,
	[TwoFactorAction.CHANGE_PASSWORD]: 60
}

export const GRACE_TTL = 300

export const USER_PROJECTS_LIMIT = 1

export const AVATAR_SIZES = [512, 128, 64]