import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { UserModule } from './user/user.module'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { TelegramModule } from './telegram/telegram.module'
import { EmailModule } from './email/email.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		UserModule,
		AuthModule,
		EmailModule,
		TelegramModule
	],
	controllers: [AppController],
})
export class AppModule {}
