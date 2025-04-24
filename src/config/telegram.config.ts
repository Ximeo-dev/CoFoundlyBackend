import { GrammyModuleOptions } from '@grammyjs/nestjs'
import { ConfigService } from '@nestjs/config'

export const getTelegramConfig = async (
	configService: ConfigService,
): Promise<GrammyModuleOptions> => ({
	token: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
	pollingOptions: {
		drop_pending_updates: true,
	}
})
