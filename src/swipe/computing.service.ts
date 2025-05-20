import { Injectable } from '@nestjs/common'
import { UserProfileExtended } from 'src/profile/types/profile.types'
import { SwipeIntent } from './types/swipe.types'
import { Skill } from '@prisma/client'
import { SWIPE_SCORE_WEIGHTS as WEIGHTS } from 'src/constants/constants'

@Injectable()
export class ComputingService {
	constructor() {}

	public calculateScore(
		current: UserProfileExtended,
		candidate: UserProfileExtended,
		intent: SwipeIntent,
	): number {
		let skillScore: number
		if (intent == SwipeIntent.SIMILAR) {
			skillScore = this.overlapScore(current.skills, candidate.skills)
		} else {
			skillScore = this.computeSkillComplement(current.skills, candidate.skills)
		}

		const industryOverlap = this.overlapScore(
			current.industries,
			candidate.industries,
		)
		const languageOverlap = this.overlapScore(
			current.languages,
			candidate.languages,
		)

		const score =
			skillScore * WEIGHTS.skills +
			industryOverlap * WEIGHTS.industries +
			languageOverlap * WEIGHTS.languages

		return score
	}

	overlapScore<T extends { id: number }>(a: T[], b: T[]): number {
		if (a.length === 0 && b.length === 0) {
			return 0 // Если оба списка пусты, возвращаем нейтральный балл
		}

		const aIds = new Set(a.map((item) => item.id))
		const bIds = new Set(b.map((item) => item.id))
		const common = [...aIds].filter((id) => bIds.has(id))
		const union = new Set([...aIds, ...bIds])

		if (union.size === 0) {
			return 0 // Если объединение пусто, возвращаем 0
		}

		return common.length / union.size
	}

	computeSkillComplement(a: Skill[], b: Skill[]): number {
		if (a.length === 0 && b.length === 0) {
			return 1 // Если оба списка навыков пусты, считаем их максимально дополняющими
		}
		const overlap = this.overlapScore(a, b)
		return 1 - overlap
	}
}
