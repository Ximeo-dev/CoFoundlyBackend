import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AccountNotConfirmedException } from 'src/exceptions/AccountNotConfirmedException'

export class AccountConfirmedGuard extends AuthGuard('jwt') {
	handleRequest(err, user, info, context: ExecutionContext) {
		if (err || !user || !user.isEmailConfirmed) {
			throw err || new AccountNotConfirmedException()
		}
		return user
	}
}
