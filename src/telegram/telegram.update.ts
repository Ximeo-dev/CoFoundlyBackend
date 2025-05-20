import { CallbackQuery, Command, Start, Update } from '@grammyjs/nestjs'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Bot, CallbackQueryContext, Context } from 'grammy'
import { TelegramService } from './telegram.service'
import { parseCommandArgs } from 'src/utils/parse-command-args'
import { getActionText } from './action-texts'
import {
	TwoFactorAction,
	TwoFactorActionStatusEnum,
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

		if (!token) {
			return ctx.reply('❌ Пожалуйста, укажи токен: /2fa <токен>')
		}

		return this.telegramService.handleTelegramBindCommand(ctx, token)
	}

	@CallbackQuery(/^2fa:bind:confirm:(.+)$/)
	async onConfirmBind2FA(ctx: CallbackQueryContext<Context>) {
		const userId = ctx.match[1]
		const telegramId = ctx.from.id.toString()

		await this.telegramService.confirmTelegramBind(userId, telegramId, ctx)
	}

	@CallbackQuery(/^2fa:bind:reject:(.+)$/)
	async onRejectBind2FA(ctx: CallbackQueryContext<Context>) {
		await ctx.editMessageText(
			getActionText(TwoFactorAction.BIND, 'rejected', {}),
		)
	}

	@CallbackQuery(/^2fa:unbind:confirm:(.+)$/)
	async onConfirmUnbind2FA(ctx: CallbackQueryContext<Context>) {
		const userId = ctx.match[1]

		await this.telegramService.handleTelegramUnbind(
			userId,
			ctx,
			TwoFactorActionStatusEnum.CONFIRMED,
		)
	}

	@CallbackQuery(/^2fa:unbind:reject:(.+)$/)
	async onRejectUnbind2FA(ctx: CallbackQueryContext<Context>) {
		const userId = ctx.match[1]

		await this.telegramService.handleTelegramUnbind(
			userId,
			ctx,
			TwoFactorActionStatusEnum.REJECTED,
		)
	}

	@CallbackQuery(/^2fa:delete-project:confirm:(.+)$/)
	async onConfirmDeleteProject(ctx: CallbackQueryContext<Context>) {
		const userId = ctx.match[1]

		await this.telegramService.handleAction(
			ctx,
			userId,
			TwoFactorAction.DELETE_PROJECT,
			TwoFactorActionStatusEnum.CONFIRMED,
		)
	}

	@CallbackQuery(/^2fa:delete-project:reject:(.+)$/)
	async onRejectDeleteProject(ctx: CallbackQueryContext<Context>) {
		const userId = ctx.match[1]

		await this.telegramService.handleAction(
			ctx,
			userId,
			TwoFactorAction.DELETE_PROJECT,
			TwoFactorActionStatusEnum.REJECTED,
		)
	}

	@CallbackQuery(/^2fa:delete-profile:confirm:(.+)$/)
	async onConfirmDeleteProfile(ctx: CallbackQueryContext<Context>) {
		const userId = ctx.match[1]

		await this.telegramService.handleAction(
			ctx,
			userId,
			TwoFactorAction.DELETE_PROFILE,
			TwoFactorActionStatusEnum.CONFIRMED,
		)
	}

	@CallbackQuery(/^2fa:delete-profile:reject:(.+)$/)
	async onRejectDeleteProfile(ctx: CallbackQueryContext<Context>) {
		const userId = ctx.match[1]

		await this.telegramService.handleAction(
			ctx,
			userId,
			TwoFactorAction.DELETE_PROFILE,
			TwoFactorActionStatusEnum.REJECTED,
		)
	}
}
