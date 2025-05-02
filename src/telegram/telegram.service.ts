import { InjectBot } from '@grammyjs/nestjs'
import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Bot, Context } from 'grammy'
import {
	AuthService,
	ConfirmTwoFAResult,
	TwoFAResult,
} from 'src/auth/auth.service'
import { onlyAllowedUsers } from './middlewares/only-allowed-users'
import { TwoFactorAction } from 'src/types/2fa.types'
import { UserWithSecurity } from 'src/types/user.types'
import { User } from '@prisma/client'

@Injectable()
export class TelegramService {
	private readonly BOT_TOKEN: string

	constructor(
		@InjectBot() private readonly bot: Bot<Context>,
		private readonly configService: ConfigService,
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService,
	) {
		this.BOT_TOKEN = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN')
		if (configService.getOrThrow<string>('NODE_ENV') === 'development')
			bot.use(onlyAllowedUsers)
	}

	async handle2FACommand(ctx: Context, token: string) {
		const telegramId = ctx.from?.id
		if (!telegramId) {
			return ctx.reply('Не удалось определить ваш Telegram ID')
		}

		const { result, user } = await this.authService.handle2FAToken<User>(
			token,
			TwoFactorAction.BIND,
			async (user) => {
				const { securitySettings, ...rest } = user

				if (securitySettings.twoFactorEnabled) {
					await ctx.reply('2FA уже подключена к вашему аккаунту')
					return
				}
		
				return rest
			}
		)

		switch (result) {
			case TwoFAResult.UserNotFound:
				return ctx.reply('Пользователь не найден')
			case TwoFAResult.TokenExpired:
				return ctx.reply('Срок действия токена истёк. Сгенерируйте новый токен')
			case TwoFAResult.Valid:
				if (!user) return
				return ctx.reply(
					`Вы действительно хотите подключить этот Telegram (*${ctx.from.username ?? ctx.from.id}*) к вашему аккаунту *${user.email}*?\n\nЕсли вы потеряете доступ к Telegram, восстановление аккаунта может быть невозможно`,
					{
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: '✅ Подтвердить',
										callback_data: `2fa_confirm_${user.id}`,
									},
									{
										text: '❌ Отменить',
										callback_data: `2fa_cancel`,
									},
								],
							],
						},
						parse_mode: 'Markdown',
					},
				)
		}
	}

	async confirmTelegramBind(userId: string, telegramId: string, ctx: Context) {
		const result = await this.authService.confirm2FA(userId, telegramId)

		switch (result) {
			case ConfirmTwoFAResult.UserNotFound:
				return ctx.reply('Пользователь не найден')
			case ConfirmTwoFAResult.Success:
				await ctx.answerCallbackQuery({ text: '✅ Привязка успешно завершена' })
				return ctx.editMessageText('✅ Telegram успешно привязан к аккаунту')
		}
	}
}
