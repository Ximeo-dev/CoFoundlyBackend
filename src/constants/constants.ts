import { TwoFactorAction } from 'src/types/2fa.types'

export const TTL_BY_ACTION: Record<TwoFactorAction, number> = {
	[TwoFactorAction.BIND]: 300,
	[TwoFactorAction.LOGIN]: 180,
	[TwoFactorAction.CHANGE_EMAIL]: 180,
}
