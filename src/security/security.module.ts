import { forwardRef, Module } from '@nestjs/common'
import { TelegramModule } from 'src/telegram/telegram.module'
import { UserModule } from 'src/user/user.module'
import { SecurityService } from './security.service'
import { TwoFactorController } from './two-factor.controller'
import { TwoFactorService } from './two-factor.service'
import { AuthModule } from 'src/auth/auth.module'
import { SecurityController } from './security.controller'
import { MailModule } from 'src/mail/mail.module'

@Module({
	imports: [
		UserModule,
		forwardRef(() => TelegramModule),
		MailModule,
		AuthModule,
	],
	controllers: [TwoFactorController, SecurityController],
	providers: [TwoFactorService, SecurityService],
	exports: [TwoFactorService, SecurityService],
})
export class SecurityModule {}
