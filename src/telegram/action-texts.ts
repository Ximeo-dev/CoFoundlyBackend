import { compile } from 'handlebars'
import {
	TwoFactorAction,
	TwoFactorActionStatus,
} from 'src/two-factor/types/two-factor.types'

export const ActionTexts = {
	[TwoFactorAction.BIND]: {
		pending:
			'Вы действительно хотите подключить этот Telegram (*{{username}}*) к вашему аккаунту *{{email}}*?\n\nЕсли вы потеряете доступ к Telegram, восстановление аккаунта может быть невозможно',
		confirmed:
			'✅ Telegram успешно привязан к аккаунту',
		expired:
			'⌛️ Срок действия привязки двухфакторной аутентификации истёк. Получите новый код привязки',
		rejected: '❌ Привязка Telegram отменена'
	},
	[TwoFactorAction.UNBIND]: {
		pending:
			'Запрос на отключение двухфакторной аутентификации для аккаунта *{{email}}* с IP-адреса *{{ip}}*',
		confirmed: '⚠️ Двухфакторная аутентификация отключена',
		expired:
			'⌛️ Срок подтверждения отключения двухфакторной аутентификации истёк',
		rejected: '❌ Отключение 2FA отменено'
	},
}

export function getActionText(
	action: TwoFactorAction,
	status: TwoFactorActionStatus,
	context: object,
) {
	const template = ActionTexts[action]?.[status]
	if (!template) return 'Неизвестное действие'

	return compile(template)(context)
}
