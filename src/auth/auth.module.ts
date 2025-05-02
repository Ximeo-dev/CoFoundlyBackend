import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { getJwtConfig } from 'src/config/jwt.config'
import { EmailModule } from 'src/email/email.module'
import { RedisService } from 'src/redis/redis.service'
import { TelegramModule } from 'src/telegram/telegram.module'
import { UserModule } from 'src/user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { RedisModule } from 'src/redis/redis.module'

@Module({
	imports: [
		UserModule,
		EmailModule,
		forwardRef(() => TelegramModule),
		ConfigModule,
		JwtModule.registerAsync({
			global: true,
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getJwtConfig,
		})
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy],
	exports: [AuthService],
})
export class AuthModule {}
