import { InjectBot } from '@grammyjs/nestjs'
import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Bot, Context } from 'grammy'
import { TwoFactorService } from 'src/security/two-factor.service'
import {
	TwoFactorAction,
	TwoFactorActionStatusEnum,
	TwoFactorHandleResult,
} from 'src/security/types/two-factor.types'
import { UserWithSecurity } from 'src/user/types/user.types'
import { getActionText } from './action-texts'
import { getErrorText } from './error-texts'
import { onlyAllowedUsersMiddleware } from './middlewares/only-allowed-users'

@Injectable()
export class TelegramService {
	constructor(
		@InjectBot() private readonly bot: Bot<Context>,
		private readonly configService: ConfigService,
		@Inject(forwardRef(() => TwoFactorService))
		private readonly twoFactorService: TwoFactorService,
	) {
		if (configService.getOrThrow<string>('NODE_ENV') === 'development') {
			bot.use(onlyAllowedUsersMiddleware)
		}

		bot.api
			.setMyCommands([
				{ command: 'start', description: 'Запустить бота' },
				{
					command: '2fa',
					description: 'Привязать 2FA к аккаунту. Использование: /2fa <token>',
				},
			])
			.catch((err) => {
				console.error('Ошибка установки команд Telegram:', err)
			})
	}

	public get2FAKey(userId: string, action: string, type: 'confirm' | 'reject') {
		return `2fa:${action}:${type}:${userId}`
	}

	private create2FAKeyboard(userId: string, action: string) {
		return {
			inline_keyboard: [
				[
					{
						text: '✅ Подтвердить',
						callback_data: this.get2FAKey(userId, action, 'confirm'),
					},
					{
						text: '❌ Отклонить',
						callback_data: this.get2FAKey(userId, action, 'reject'),
					},
				],
			],
		}
	}

	async send2FAConfirmation(
		user: UserWithSecurity,
		action: TwoFactorAction,
		telegramId: string,
		ip: string,
	) {
		const actionText = getActionText(action, 'pending', {
			email: user.email,
			displayUsername: user.displayUsername,
			ip,
		})

		await this.bot.api.sendMessage(telegramId, actionText, {
			reply_markup: this.create2FAKeyboard(user.id, action),
			parse_mode: 'Markdown',
		})
	}

	async handleTelegramBindCommand(ctx: Context, token: string) {
		const telegramId = ctx.from?.id
		if (!telegramId) {
			return ctx.reply('⚠️ Не удалось определить ваш Telegram ID')
		}

		const isTelegramIdAvailable =
			await this.twoFactorService.checkTelegramIdAvailable(
				telegramId.toString(),
			)

		if (!isTelegramIdAvailable)
			return ctx.reply('⚠️ Этот Telegram уже привязан к другому аккаунту')

		const { result, user } = await this.twoFactorService.handleBindToken(token)

		if (result != TwoFactorHandleResult.Success)
			return ctx.reply(getErrorText(result, {}))

		if (!user)
			return ctx.reply(getErrorText(TwoFactorHandleResult.UserNotFound, {}))
		return ctx.reply(
			getActionText(TwoFactorAction.BIND, 'pending', {
				username: ctx.from.username ?? ctx.from.id,
				email: user.email,
			}),
			{
				reply_markup: this.create2FAKeyboard(user.id, TwoFactorAction.BIND),
				parse_mode: 'Markdown',
			},
		)
	}

	async confirmTelegramBind(userId: string, telegramId: string, ctx: Context) {
		const result = await this.twoFactorService.confirmBind2FA(
			userId,
			telegramId,
		)

		if (result != TwoFactorHandleResult.Success)
			return ctx.editMessageText(getErrorText(result, {}))

		await ctx.answerCallbackQuery({ text: '✅ Привязка успешно завершена' })
		return ctx.editMessageText(
			getActionText(TwoFactorAction.BIND, 'confirmed', {}),
		)
	}

	async handleTelegramUnbind(
		userId: string,
		ctx: Context,
		type:
			| TwoFactorActionStatusEnum.CONFIRMED
			| TwoFactorActionStatusEnum.REJECTED,
	) {
		if (type == TwoFactorActionStatusEnum.REJECTED) {
			await this.twoFactorService.confirmAction(
				userId,
				TwoFactorAction.UNBIND,
				TwoFactorActionStatusEnum.REJECTED,
			)
			return ctx.editMessageText(
				getActionText(TwoFactorAction.UNBIND, 'rejected', {}),
			)
		}

		const result = await this.twoFactorService.handleUnbind2FA(userId)

		if (result != TwoFactorHandleResult.Success)
			return ctx.editMessageText(getErrorText(result, {}))

		await this.twoFactorService.confirmAction(
			userId,
			TwoFactorAction.UNBIND,
			TwoFactorActionStatusEnum.CONFIRMED,
		)
		await ctx.answerCallbackQuery({ text: '⚠️ 2FA отключена' })
		return ctx.editMessageText(
			getActionText(TwoFactorAction.UNBIND, 'confirmed', {}),
		)
	}

	async handleAction(
		ctx: Context,
		userId: string,
		action: TwoFactorAction,
		type:
			| TwoFactorActionStatusEnum.CONFIRMED
			| TwoFactorActionStatusEnum.REJECTED,
	) {
		await this.twoFactorService.confirmAction(userId, action, type)
		return ctx.editMessageText(getActionText(action, type, {}))
	}
}
