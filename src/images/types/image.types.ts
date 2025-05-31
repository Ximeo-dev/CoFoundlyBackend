export const AvatarType = {
	USER: 'user',
	PROJECT: 'project',
} as const

export type AvatarType = (typeof AvatarType)[keyof typeof AvatarType]