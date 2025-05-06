import { compile } from 'handlebars'
import { TwoFactorHandleResult } from 'src/two-factor/types/two-factor.types'

export const ErrorTexts = {
	[TwoFactorHandleResult.UserNotFound]: '⚠️ Пользователь не найден',
	[TwoFactorHandleResult.AlreadyEnabled]:
		'✅ 2FA уже подключена к вашему аккаунту',
	[TwoFactorHandleResult.TokenExpired]:
		'⌛️ Срок действия привязки двухфакторной аутентификации истёк. Попробуйте снова',
}

export function getErrorText(error: TwoFactorHandleResult, context: object) {
	const template = ErrorTexts[error]
	if (!template) return 'Неизвестное действие'

	return compile(template)(context)
}
