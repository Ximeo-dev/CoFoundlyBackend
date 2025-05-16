import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { getJwtConfig } from 'src/config/jwt.config'
import { UserModule } from 'src/user/user.module'
import { EmailController } from './email.controller'
import { EmailService } from './email.service'

@Module({
	imports: [
		forwardRef(() => UserModule),
		ConfigModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getJwtConfig,
		}),
	],
	controllers: [EmailController],
	providers: [EmailService],
	exports: [EmailService],
})
export class EmailModule {}
