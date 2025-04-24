import { Ctx, InjectBot } from '@grammyjs/nestjs'
import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Bot, Context } from 'grammy'
import { AuthService, TwoFAResult } from 'src/auth/auth.service'

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
	}

	async handle2FACommand(ctx: Context, token: string) {
		const telegramId = ctx.from?.id
		if (!telegramId) {
			return ctx.reply('Не удалось определить ваш Telegram ID')
		}

		const { result, user } = await this.authService.handle2FAToken(token)

		switch (result) {
			case TwoFAResult.UserNotFound:
				return ctx.reply('Пользователь не найден')
			case TwoFAResult.AlreadyEnabled:
				return ctx.reply('2FA уже подключена к вашему аккаунту')
			case TwoFAResult.TokenExpired:
				return ctx.reply(
					'Срок действия токена истёк. Сгенерируйте токен заново',
				)
			case TwoFAResult.Valid:
				if (!user) return ctx.reply('Ошибка подключения 2FA')
				return ctx.reply(
					`Вы действительно хотите подключить этот Telegram (*${ctx.from.username ?? ctx.from.id}*) к вашему аккаунту *${user.email}*?\n\nЕсли вы потеряете доступ к Telegram, восстановление аккаунта может быть невозможно.`,
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
		return this.authService.confirm2FA(userId, telegramId, ctx)
	}
}
