import {
	Controller,
	Get,
	HttpCode,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { Require2FA } from 'src/security/decorators/two-factor.decorator'
import { TwoFactorGuard } from 'src/security/guards/two-factor.guard'
import { TwoFactorAction } from 'src/security/types/two-factor.types'
import { TwoFactorService } from './two-factor.service'
import { Confirmed } from './decorators/confirmed.decorator'
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiQuery,
} from '@nestjs/swagger'
import { EnumValidationPipe } from 'src/pipes/enum-validation-pipe'

@Controller('2fa')
@ApiBearerAuth()
export class TwoFactorController {
	constructor(private readonly twoFactorService: TwoFactorService) {}

	@ApiOperation({ summary: 'Get bind 2FA token' })
	@ApiOkResponse({ type: String })
	@HttpCode(200)
	@Post('bind')
	@Confirmed()
	@Auth()
	async getBind2FAToken(@CurrentUser('id') id: string) {
		return this.twoFactorService.issueBindToken(id)
	}

	@ApiOperation({
		summary: 'Unbind 2FA',
		description: 'Unbind 2FA. Requires 2FA confirmation',
	})
	@ApiOkResponse({ type: String, example: 'success' })
	@ApiForbiddenResponse({ description: '2FA confirmation required' })
	@HttpCode(200)
	@Post('unbind')
	@Require2FA(TwoFactorAction.UNBIND)
	@UseGuards(TwoFactorGuard)
	@Auth()
	async unbind2FA(@CurrentUser('id') id: string) {
		return this.twoFactorService.unbind2FA(id)
	}

	@ApiOperation({ summary: 'Get 2FA action status' })
	@ApiOkResponse({ description: 'Status of 2FA action', example: 'confirmed' })
	@ApiQuery({ name: 'action', enum: TwoFactorAction })
	@Get('status')
	@Auth()
	async getActionStatus(
		@CurrentUser('id') id: string,
		@Query('action', new EnumValidationPipe(TwoFactorAction))
		action: TwoFactorAction,
	) {
		return this.twoFactorService.getActionStatus(id, action)
	}
}
