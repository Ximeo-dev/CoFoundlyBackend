import { GrammyModuleOptions } from '@grammyjs/nestjs'
import { ConfigService } from '@nestjs/config'

export const getTelegramConfig = async (
	configService: ConfigService,
): Promise<GrammyModuleOptions> => ({
	token:
		configService.getOrThrow('NODE_ENV') === 'development'
			? configService.getOrThrow<string>('TELEGRAM_DEV_BOT_TOKEN')
			: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
	pollingOptions: {
		drop_pending_updates: true,
	},
})
