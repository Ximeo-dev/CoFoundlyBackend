import { SetMetadata, UseGuards } from '@nestjs/common'
import { TwoFactorAction } from 'src/two-factor/types/two-factor.types'

export const REQUIRE_2FA_KEY = 'require-2fa-action'

export const Require2FA = (action: TwoFactorAction) =>
	SetMetadata(REQUIRE_2FA_KEY, action)
