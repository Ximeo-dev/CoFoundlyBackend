import { Industry, Job, Language, Skill, UserProfile } from '@prisma/client'

export type UserProfileExtended = {
	skills: Skill[]
	languages: Language[]
	industries: Industry[]
} & { id: number; userId: string }

export type UserFullProfileExtended = {
	user: {
		username: string
		displayUsername: string
	}
	job: Job | null
	skills: Skill[]
	languages: Language[]
	industries: Industry[]
} & UserProfile

export type OneToManyType = 'job' | 'projectRole' | 'industry'
export type ManyToManyType = 'skill' | 'language' | 'industry' | 'job'
