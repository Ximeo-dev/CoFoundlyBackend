import { Injectable, NotFoundException } from '@nestjs/common'
import { ChatType } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { UserProfileService } from 'src/profile/user-profile.service'
import { ChatService } from 'src/ws/chat/chat.service'
import { ChatServerEvent } from 'src/ws/types/events'
import { WebsocketService } from 'src/ws/websocket.service'
import { ComputingService } from './computing.service'
import { ScoredCandidate, SwipeAction, SwipeIntent } from './types/swipe.types'
import { SCORE_BOOST_FOR_LIKED_ME } from 'src/constants/constants'
import Heap from 'heap-js'
import { UserProfileExtended } from 'src/profile/types/profile.types'

@Injectable()
export class SwipeService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly computingService: ComputingService,
		private readonly userProfileService: UserProfileService,
		private readonly websocketService: WebsocketService,
		private readonly chatService: ChatService,
	) {}

	async findCandidate(currentUserId: string, intent: SwipeIntent) {
		const currentUser = (await this.userProfileService.getUserProfile(
			currentUserId,
			false,
		)) as UserProfileExtended

		if (!currentUser) throw new NotFoundException('User profile not found')

		const candidates = await this.prisma.userProfile.findMany({
			where: {
				userId: {
					not: currentUserId,
				},
				NOT: {
					receivedSwipes: {
						some: { fromProfileId: currentUser?.id },
					},
				},
			},
			select: {
				id: true,
				userId: true,
				skills: true,
				industries: true,
				languages: true,
				performedSwipes: {
					where: {
						toProfileId: currentUser.id,
						isLiked: true,
					},
					select: { id: true },
				},
			},
			take: 50,
		})

		const heap = new Heap(
			(a: ScoredCandidate, b: ScoredCandidate) => b.score - a.score,
		)

		candidates.forEach((candidate) => {
			let score = this.computingService.calculateScore(
				currentUser,
				candidate,
				intent,
			)
			const likedMe = candidate.performedSwipes.length > 0
			if (likedMe) score += SCORE_BOOST_FOR_LIKED_ME
			const jitter = 1 + (Math.random() * 0.2 - 0.1)
			heap.push({ candidate, score: score * jitter })
		})

		const bestCandidate = heap.pop()?.candidate

		if (!bestCandidate) return null
		// В будущем делать выдачу Top-N, а не Top-1
		return this.userProfileService.getForeignUserProfile(bestCandidate.userId)
	}

	async handleSwipe(fromUserId: string, toUserId: string, action: SwipeAction) {
		const fromProfile = await this.prisma.userProfile.findUnique({
			where: { userId: fromUserId },
		})
		const toProfile = await this.prisma.userProfile.findUnique({
			where: { userId: toUserId },
		})
		if (!fromProfile || !toProfile)
			throw new NotFoundException('Profile not found')

		const existingSwipe = await this.prisma.swipe.findFirst({
			where: {
				fromProfileId: fromProfile.id,
				toProfileId: toProfile.id,
			},
		})

		if (existingSwipe) {
			await this.prisma.swipe.update({
				where: { id: existingSwipe.id },
				data: { isLiked: action === SwipeAction.LIKE },
			})
		} else {
			await this.prisma.swipe.create({
				data: {
					fromProfileId: fromProfile.id,
					toProfileId: toProfile.id,
					isLiked: action === SwipeAction.LIKE,
				},
			})
		}

		if (action === SwipeAction.LIKE) {
			const reverseSwipe = await this.prisma.swipe.findFirst({
				where: {
					fromProfileId: toProfile.id,
					toProfileId: fromProfile.id,
					isLiked: true,
				},
			})

			if (reverseSwipe) {
				const participantIds = [fromUserId, toUserId]
				const chat = await this.chatService.createChat(
					participantIds,
					ChatType.DIRECT,
				)

				this.websocketService.server.in(participantIds).socketsJoin(chat.id)

				this.websocketService.emitToRoom(chat.id, ChatServerEvent.NEW_CHAT, {
					chatId: chat.id,
				})

				return { isMatch: true, matchedUserId: toUserId }
			}
		}

		return { isMatch: false }
	}

	async resetSwipes(userId: string) {
		const profile = await this.prisma.userProfile.findUnique({
			where: { userId },
		})
		if (!profile) throw new NotFoundException('Profile not found')

		await this.prisma.swipe.deleteMany({
			where: {
				OR: [{ fromProfileId: profile.id }, { toProfileId: profile.id }],
			},
		})

		return { message: 'Swipe history reset successfully' }
	}
}
