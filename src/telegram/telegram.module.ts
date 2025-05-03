import { NestjsGrammyModule } from '@grammyjs/nestjs'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { getTelegramConfig } from 'src/config/telegram.config'
import { TelegramUpdate } from './telegram.update'
import { AuthModule } from 'src/auth/auth.module'
import { TelegramService } from './telegram.service'
import { TwoFactorModule } from 'src/two-factor/two-factor.module'

@Module({
	imports: [
		forwardRef(() => TwoFactorModule),
		ConfigModule,
		NestjsGrammyModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getTelegramConfig,
		})
	],
	providers: [TelegramUpdate, TelegramService],
	exports: [TelegramService],
})
export class TelegramModule {}
