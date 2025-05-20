import { Industry, Language, Skill, UserProfile } from '@prisma/client'
import { Entity } from 'src/entities/types/entity.types'

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
	job: Entity | null
	skills: Entity[]
	languages: Entity[]
	industries: Entity[]
} & UserProfile

export type OneToManyType = 'job' | 'projectRole' | 'industry'
export type ManyToManyType = 'skill' | 'language' | 'industry' | 'job'
