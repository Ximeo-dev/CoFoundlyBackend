import { Socket } from 'socket.io'
import { UserWithSecurity } from 'src/user/types/user.types'

export interface AuthenticatedSocket extends Socket {
	user: UserWithSecurity
}
