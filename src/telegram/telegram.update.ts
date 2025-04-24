import {
	CallbackQuery,
	Command,
	InjectBot,
	Start,
	Update,
} from '@grammyjs/nestjs'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Bot, CallbackQueryContext, CommandContext, Context } from 'grammy'
import { TelegramService } from './telegram.service'
import { parseCommandArgs } from 'src/utils/parseCommandArgs'

@Update()
@Injectable()
export class TelegramUpdate {
	constructor(private readonly telegramService: TelegramService) {}

	@Start()
	async onStart(ctx: Context) {
		await ctx.reply('Привет!')
	}

	@Command('2fa')
	async handle2FA(ctx: Context) {
		const [token] = parseCommandArgs(ctx.message?.text)

		if (!token) {
			return ctx.reply('❌ Пожалуйста, укажи токен: /2fa <токен>')
		}

		return this.telegramService.handle2FACommand(ctx, token)
	}

	@CallbackQuery(/^2fa_confirm_(.+)$/)
	async onConfirm2fa(ctx: CallbackQueryContext<Context>) {
		const userId = ctx.match[1]
		const telegramId = ctx.from.id.toString()

		await this.telegramService.confirmTelegramBind(userId, telegramId, ctx)
	}

	@CallbackQuery('2fa_cancel')
	async onCancel2fa(ctx: CallbackQueryContext<Context>) {
		await ctx.answerCallbackQuery({ text: '❌ Привязка отменена' })
		await ctx.editMessageText('❌ Привязка Telegram отменена.')
	}
}
