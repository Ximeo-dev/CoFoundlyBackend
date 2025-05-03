import { forwardRef, Module } from '@nestjs/common'
import { TwoFactorService } from './two-factor.service'
import { TwoFactorController } from './two-factor.controller'
import { UserModule } from 'src/user/user.module'
import { TelegramModule } from 'src/telegram/telegram.module'

@Module({
	imports: [UserModule, forwardRef(() => TelegramModule)],
	controllers: [TwoFactorController],
	providers: [TwoFactorService],
	exports: [TwoFactorService],
})
export class TwoFactorModule {}
