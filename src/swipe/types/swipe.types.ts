import { Industry, Language, Skill } from '@prisma/client'

export const SwipeIntent = {
	COMPLEMENT: 'complement',
	SIMILAR: 'similar',
	LIKED: 'liked'
} as const

export type SwipeIntent = (typeof SwipeIntent)[keyof typeof SwipeIntent]

export const SwipeAction = {
	LIKE: 'like',
	SKIP: 'skip',
} as const

export type SwipeAction = (typeof SwipeAction)[keyof typeof SwipeAction]

export interface Candidate {
	id: number
	userId: string
	skills: Skill[]
	languages: Language[]
	industries: Industry[]
	performedSwipes: {
		id: bigint
	}[]
}

export type ScoredCandidate = {
	candidate: Candidate,
	score: number
}