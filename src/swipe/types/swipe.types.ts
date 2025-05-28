import { Industry, Language, Skill } from '@prisma/client'

export enum SwipeIntent {
	COMPLEMENT = 'complement',
	SIMILAR = 'similar',
}

export enum SwipeAction {
	LIKE = 'like',
	SKIP = 'skip',
}

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