import { Industry, Language, Skill, UserProfile } from '@prisma/client'

export type UserProfileExtended = {
	skills: Skill[]
	languages: Language[]
	industries: Industry[]
} & { id: number; userId: string }
