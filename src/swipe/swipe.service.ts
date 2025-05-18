import { Injectable, NotFoundException } from '@nestjs/common'
import { ChatType } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { UserProfileService } from 'src/profile/user-profile.service'
import { ChatService } from 'src/ws/chat/chat.service'
import { ChatServerEvent } from 'src/ws/types/events'
import { WebsocketService } from 'src/ws/websocket.service'
import { ComputingService } from './computing.service'
import { SwipeAction, SwipeIntent } from './types/swipe.types'

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
		const currentUser = await this.prisma.userProfile.findUnique({
			where: { userId: currentUserId },
			include: {
				skills: true,
				industries: true,
				languages: true,
			},
		})

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
			},
		})

		const scored = candidates.map((candidate) => {
			let score = this.computingService.calculateScore(
				currentUser,
				candidate,
				intent,
			)
			const jitter = 1 + (Math.random() * 0.4 - 0.2)
			score *= jitter
			return { candidate, score }
		})

		scored.sort((a, b) => b.score - a.score)

		const firstScored = scored[0]?.candidate

		if (!firstScored) return null
		return this.userProfileService.getForeignUserProfile(firstScored.userId)
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

				const usersSockets = await this.websocketService.server
					.in(participantIds)
					.fetchSockets()

				usersSockets.forEach((socket) => {
					socket.join(chat.id)
				})

				this.websocketService.emitToRoom(
					chat.id,
					ChatServerEvent.NEW_CHAT,
					chat,
				)

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
