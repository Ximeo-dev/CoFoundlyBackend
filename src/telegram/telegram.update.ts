import { CallbackQuery, Command, Start, Update } from '@grammyjs/nestjs'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CallbackQueryContext, Context } from 'grammy'
import { TelegramService } from './telegram.service'
import { parseCommandArgs } from 'src/utils/parse-command-args'
import { getActionText } from './action-texts'
import {
	TwoFactorAction,
	TwoFactorActionStatus,
	TwoFactorFinalActionStatuses,
} from 'src/security/types/two-factor.types'

@Update()
@Injectable()
export class TelegramUpdate {
	constructor(
		private readonly telegramService: TelegramService,
		private readonly configService: ConfigService,
	) {}

	@Start()
	async onStart(ctx: Context) {
		const messageText = ctx.message?.text || ''
		const parts = messageText.split(' ')
		const payload = parts.length > 1 ? parts[1] : null

		if (payload && payload.startsWith('2fa_')) {
			const token = payload.slice('2fa_'.length)

			await ctx.deleteMessage()

			return this.telegramService.handleTelegramBindCommand(ctx, token)
		} else if (payload) {
			await ctx.reply(`⚠️ Неизвестный параметр: ${payload}`)
		} else {
			const web_app_url = this.configService.get<string>('FRONTEND_URL')
			if (!web_app_url) {
				return await ctx.reply(`👋 Привет! Это телеграм бот CoFoundly`)
			}
			await ctx.reply(`👋 Привет! Это телеграм бот CoFoundly`, {
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: 'Запустить CoFoundly',
								web_app: {
									url: `https://${web_app_url}`,
								},
							},
						],
					],
				},
			})
		}
	}

	@Command('2fa')
	async handle2FA(ctx: Context) {
		const [token] = parseCommandArgs(ctx.message?.text)

		await ctx.deleteMessage()

		if (!token) {
			return ctx.reply('❌ Пожалуйста, укажи токен: /2fa <токен>')
		}

		return this.telegramService.handleTelegramBindCommand(ctx, token)
	}

	@CallbackQuery(
		/^2fa:(bind|unbind|delete-project|delete-profile):(confirmed|rejected):(.+)$/,
	)
	async onTwoFactorCallback(ctx: CallbackQueryContext<Context>) {
		const [action, status, userId] = ctx.match.slice(1) as [
			TwoFactorAction,
			TwoFactorFinalActionStatuses,
			string,
		]

		if (!action || !status) {
			return ctx.answerCallbackQuery({
				text: 'Неверный формат действия.',
				show_alert: true,
			})
		}

		if (action === TwoFactorAction.BIND) {
			if (status === TwoFactorActionStatus.REJECTED) {
				return ctx.editMessageText(getActionText(action, status, {}))
			}

			const telegramId = ctx.from.id.toString()
			return this.telegramService.confirmTelegramBind(userId, telegramId, ctx)
		}

		if (action === TwoFactorAction.UNBIND) {
			return this.telegramService.handleTelegramUnbind(userId, ctx, status)
		}

		return this.telegramService.handleAction(ctx, userId, action, status)
	}
}
