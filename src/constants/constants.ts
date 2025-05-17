import { SecurityAction } from 'src/security/types/security.types'
import { TwoFactorAction } from 'src/security/types/two-factor.types'

export const TTL_BY_2FA_ACTION: Record<TwoFactorAction, number> = {
	[TwoFactorAction.BIND]: 120,
	[TwoFactorAction.UNBIND]: 60,
	[TwoFactorAction.RESET_PASSWORD]: 300,
}

export const TTL_BY_SECURITY_ACTION: Record<SecurityAction, number> = {
	[SecurityAction.CONFIRM_EMAIL]: 300,
	[SecurityAction.CHANGE_EMAIL]: 300,
	[SecurityAction.RESET_PASSWORD]: 300,
}

export const CACHE_TTL = {
	USER_PROFILE: 3600,
} as const

export const GRACE_TTL = 300

export const USER_PROJECTS_LIMIT = 1

export const AVATAR_SIZES = [512, 128, 64]

export const MAIL_MESSAGES_FILE_PATHS = {
	EMAIL_CONFIRMATION: 'files/messages/email-confirmation.html',
	CHANGE_EMAIL_CONFIRMATION: 'files/messages/change-email-confirmation.html',
	RESET_PASSWORD_CONFIRMATION: 'files/messages/reset-password.html',
	EMAIL_CHANGED_NOTIFICATION: 'files/messages/email-changed-notification.html'
} as const
