import {
	BadRequestException,
	Controller,
	HttpCode,
	Post,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { TwoFactorAction } from 'src/two-factor/types/two-factor.types'
import { UserService } from 'src/user/user.service'
import { TwoFactorService } from './two-factor.service'
import { Require2FA } from 'src/auth/decorators/two-factor.decorator'
import { TwoFactorGuard } from 'src/auth/guards/two-factor.guard'

@Controller('2fa')
export class TwoFactorController {
	constructor(
		private readonly twoFactorService: TwoFactorService,
		private readonly userService: UserService,
	) {}

	@HttpCode(200)
	@Post('bind')
	@Auth()
	async getBind2FAToken(@CurrentUser('id') id: string) {
		const securitySettings =
			await this.userService.getUserSecuritySettingsById(id)

		if (securitySettings?.twoFactorEnabled)
			throw new BadRequestException('2FA уже подключена к вашему аккаунту')
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
