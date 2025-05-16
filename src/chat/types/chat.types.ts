import { UserProfileResponseDto } from 'src/profile/dto/user-profile.dto'

export type ChatParticipant = {
	userId: string
	displayUsername: string
	profile?: UserProfileResponseDto
}
