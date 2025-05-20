import { HttpException, HttpStatus } from '@nestjs/common'

export class AccountNotConfirmedException extends HttpException {
	constructor() {
		super(
			{
				message: 'Email not confirmed for this account',
			},
			HttpStatus.FORBIDDEN,
		)
	}
}
