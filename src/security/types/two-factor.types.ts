export const TwoFactorAction = {
	BIND: 'bind',
	UNBIND: 'unbind',
	RESET_PASSWORD: 'reset-password',
	DELETE_ACCOUNT: 'delete-account',
	DELETE_PROFILE: 'delete-profile',
	DELETE_PROJECT: 'delete-project',
} as const

export type TwoFactorAction =
	(typeof TwoFactorAction)[keyof typeof TwoFactorAction]

export const TwoFactorHandleResult = {
	UserNotFound: 'user-not-found',
	AlreadyEnabled: 'already-enabled',
	TokenExpired: 'token-expired',
	Success: 'success',
} as const

export type TwoFactorHandleResult =
	(typeof TwoFactorHandleResult)[keyof typeof TwoFactorHandleResult]

export const TwoFactorActionStatus = {
	PENDING: 'pending',
	CONFIRMED: 'confirmed',
	REJECTED: 'rejected',
	EXPIRED: 'expired',
} as const

export type TwoFactorActionStatus =
	(typeof TwoFactorActionStatus)[keyof typeof TwoFactorActionStatus]


export type TwoFactorFinalActionStatuses =
	| typeof TwoFactorActionStatus.CONFIRMED
	| typeof TwoFactorActionStatus.REJECTED
