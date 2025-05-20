import {
	Controller,
	HttpCode,
	Post,
	UseGuards,
} from '@nestjs/common'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { Require2FA } from 'src/security/decorators/two-factor.decorator'
import { TwoFactorGuard } from 'src/security/guards/two-factor.guard'
import { TwoFactorAction } from 'src/security/types/two-factor.types'
import { TwoFactorService } from './two-factor.service'
import { Confirmed } from './decorators/confirmed.decorator'

@Controller('2fa')
export class TwoFactorController {
	constructor(private readonly twoFactorService: TwoFactorService) {}

	@HttpCode(200)
	@Post('bind')
	@Confirmed()
	@Auth()
	async getBind2FAToken(@CurrentUser('id') id: string) {
		return this.twoFactorService.issueBindToken(id)
	}

	@HttpCode(200)
	@Post('unbind')
	@Require2FA(TwoFactorAction.UNBIND)
	@UseGuards(TwoFactorGuard)
	@Auth()
	async unbind2FA(@CurrentUser('id') id: string) {
		return this.twoFactorService.unbind2FA(id)
	}
}
