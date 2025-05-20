import { NestjsGrammyModule } from '@grammyjs/nestjs'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { getTelegramConfig } from 'src/config/telegram.config'
import { TelegramUpdate } from './telegram.update'
import { TelegramService } from './telegram.service'
import { SecurityModule } from 'src/security/security.module'

@Module({
	imports: [
		forwardRef(() => SecurityModule),
		ConfigModule,
		NestjsGrammyModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getTelegramConfig,
		}),
	],
	providers: [TelegramUpdate, TelegramService],
	exports: [TelegramService],
})
export class TelegramModule {}
