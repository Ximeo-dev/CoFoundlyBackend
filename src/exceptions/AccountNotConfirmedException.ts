import { HttpException, HttpStatus } from '@nestjs/common'

export class AccountNotConfirmedException extends HttpException {
	constructor() {
		super(
			{
				message:
					'Аккаунт не является подтверждённым. Подтвердите адрес электронной почты',
			},
			HttpStatus.BAD_REQUEST
		)
	}
}
