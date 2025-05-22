import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AccountNotConfirmedException } from 'src/exceptions/AccountNotConfirmedException'
import { hasSecuritySettings } from 'src/user/types/user.guards'

export class AccountConfirmedGuard extends AuthGuard('jwt') {
	handleRequest(err, user, info, context: ExecutionContext) {
		if (err || !user || !user.securitySettings.isEmailConfirmed) {
			throw err || new AccountNotConfirmedException()
		}
		return user
	}
}
