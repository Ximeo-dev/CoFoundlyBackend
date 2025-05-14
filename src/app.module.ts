import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { UserModule } from './user/user.module'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { TelegramModule } from './telegram/telegram.module'
import { EmailModule } from './email/email.module'
import { SwipeModule } from './swipe/swipe.module'
import { ProfileModule } from 'src/profile/profile.module'
import { ImagesModule } from './images/images.module'
import { RedisModule } from './redis/redis.module'
import { PrismaModule } from './prisma/prisma.module'
import { S3Module } from './s3/s3.module'
import { TwoFactorModule } from './two-factor/two-factor.module'
import { EntitiesModule } from './entities/entities.module'
import { ChatModule } from './chat/chat.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		UserModule,
		AuthModule,
		EmailModule,
		TelegramModule,
		SwipeModule,
		ProfileModule,
		ImagesModule,
		RedisModule,
		PrismaModule,
		S3Module,
		TwoFactorModule,
		EntitiesModule,
		ChatModule,
	],
	controllers: [AppController],
})
export class AppModule {}
