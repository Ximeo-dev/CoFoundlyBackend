export const SecurityAction = {
	CHANGE_EMAIL: 'change-email',
	RESET_PASSWORD: 'reset-password',
	CONFIRM_EMAIL: 'confirm-email',
} as const

export type SecurityAction =
	(typeof SecurityAction)[keyof typeof SecurityAction]
