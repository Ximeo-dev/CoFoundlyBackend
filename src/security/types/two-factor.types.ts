export enum TwoFactorAction {
	BIND = 'bind',
	UNBIND = 'unbind',
	RESET_PASSWORD = 'reset-password',
}

export enum TwoFactorHandleResult {
	UserNotFound = 'user-not-found',
	AlreadyEnabled = 'already-enabled',
	TokenExpired = 'token-expired',
	Success = 'success',
}

export type TwoFactorActionStatus =
	| 'pending'
	| 'confirmed'
	| 'rejected'
	| 'expired'

export enum TwoFactorActionStatusEnum {
	PENDING = 'pending',
	CONFIRMED = 'confirmed',
	REJECTED = 'rejected',
	EXPIRED = 'expired',
}
