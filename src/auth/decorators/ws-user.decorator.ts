import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { User } from '@prisma/client'

export const WSCurrentUser = createParamDecorator(
	(data: keyof User, ctx: ExecutionContext) => {
		const client = ctx.switchToWs().getClient()
		const user = (client as any).user

		return data ? user[data] : user
	},
)
