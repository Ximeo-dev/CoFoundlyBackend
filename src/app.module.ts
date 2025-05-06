import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { UserModule } from './user/user.module'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { TelegramModule } from './telegram/telegram.module'
import { EmailModule } from './email/email.module'
import { SwipeModule } from './swipe/swipe.module'
import { ProfileModule } from './profile/profile.module'
import { ImagesModule } from './images/images.module'
import { RedisModule } from './redis/redis.module'
import { PrismaModule } from './prisma/prisma.module'
import { S3Module } from './s3/s3.module'
import { TwoFactorModule } from './two-factor/two-factor.module'
import { SkillsModule } from './skills/skills.module'

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
		SkillsModule,
	],
	controllers: [AppController],
})
export class AppModule {}
