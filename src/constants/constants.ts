import { SecurityAction } from 'src/security/types/security.types'
import { TwoFactorAction } from 'src/security/types/two-factor.types'
import { getEnvVar } from 'src/utils/env'

export const TTL_BY_2FA_ACTION: Record<TwoFactorAction, number> = {
	[TwoFactorAction.BIND]: 120,
	[TwoFactorAction.UNBIND]: 60,
	[TwoFactorAction.RESET_PASSWORD]: 300,
	[TwoFactorAction.DELETE_ACCOUNT]: 60,
	[TwoFactorAction.DELETE_PROFILE]: 60,
	[TwoFactorAction.DELETE_PROJECT]: 60,
}

export const TTL_BY_SECURITY_ACTION: Record<SecurityAction, number> = {
	[SecurityAction.CONFIRM_EMAIL]: 300,
	[SecurityAction.CHANGE_EMAIL]: 300,
	[SecurityAction.RESET_PASSWORD]: 300,
}

export const CACHE_TTL = {
	USER_PROFILE: 3600,
	ENTITY: 300,
} as const

export const GRACE_TTL = 300

export const ACCESS_TOKEN_TTL = '3h'
export const REFRESH_TOKEN_TTL = '3d'
export const REFRESH_TOKEN_EXPIRE_DAYS = 3

export const USER_PROJECTS_LIMIT = 1

export const AVATAR_SIZES = [512, 128, 64]
export const MAX_AVATAR_FILESIZE = 3 * 1024 * 1024 // 3MB

export const MAIL_MESSAGES_FILE_PATHS = {
	EMAIL_CONFIRMATION: 'files/messages/email-confirmation.html',
	CHANGE_EMAIL_CONFIRMATION: 'files/messages/change-email-confirmation.html',
	RESET_PASSWORD_CONFIRMATION: 'files/messages/reset-password.html',
	EMAIL_CHANGED_NOTIFICATION: 'files/messages/email-changed-notification.html',
} as const

export const SWIPE_SCORE_WEIGHTS = {
	skills: 0.25,
	industries: 0.25,
	languages: 0.1,
	experience: 0.1,
} as const

export const CORS_ORIGIN_LIST = [
	'http://localhost:3000',
	'https://cofoundly.infinitum.su',
]

export const FRONTEND_REDIRECT_LINK = `http://${getEnvVar('FRONTEND_URL')}`
export const FRONTEND_RESET_PASSWORD = `${FRONTEND_REDIRECT_LINK}/reset-password`

export const API_URL = `http://${getEnvVar('API_URL')}`
