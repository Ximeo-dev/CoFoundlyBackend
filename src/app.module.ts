import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ProfileModule } from './profile/profile.module'
import { AppController } from './app.controller'
import { AuthModule } from './auth/auth.module'
import { EntitiesModule } from './entities/entities.module'
import { ImagesModule } from './images/images.module'
import { MailModule } from './mail/mail.module'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'
import { S3Module } from './s3/s3.module'
import { SecurityModule } from './security/security.module'
import { SwipeModule } from './swipe/swipe.module'
import { TelegramModule } from './telegram/telegram.module'
import { UserModule } from './user/user.module'
import { WebsocketModule } from './ws/websocket.module'
import { ThrottlerModule } from '@nestjs/throttler'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		ThrottlerModule.forRoot({
			throttlers: [{ ttl: 1, limit: 0 }],
		}),
		UserModule,
		AuthModule,
		MailModule,
		TelegramModule,
		SwipeModule,
		ProfileModule,
		ImagesModule,
		RedisModule,
		PrismaModule,
		S3Module,
		SecurityModule,
		EntitiesModule,
		WebsocketModule,
	],
	controllers: [AppController],
})
export class AppModule {}
