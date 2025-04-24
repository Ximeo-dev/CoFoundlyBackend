import { Context, Middleware } from 'grammy'
import { getEnvVar } from 'src/utils/env'

const allowedUserIds: string[] = getEnvVar('DEV_BOT_ALLOWED_IDS')
	.trim()
	.split(',')

export const onlyAllowedUsers: Middleware = async (ctx: Context, next) => {
	const userId = ctx.from?.id.toString()

	if (!userId || !allowedUserIds.includes(userId)) {
		await ctx.reply('⛔ У вас нет доступа к этому боту')
		return
	}

	return next()
}
