import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { User } from '@prisma/client'
import { AuthenticatedSocket } from 'src/chat/types/socket.types'

export const WSCurrentUser = createParamDecorator(
	(data: keyof User, ctx: ExecutionContext) => {
		const client = ctx.switchToWs().getClient<AuthenticatedSocket>()
		const user = client.user

		return data ? user[data] : user
	},
)
