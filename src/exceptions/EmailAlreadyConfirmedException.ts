import { HttpException, HttpStatus } from '@nestjs/common'

export class EmailAlreadyConfirmedException extends HttpException {
	constructor() {
		super(
			{
				message: 'Адрес электронной почты уже подтверждён',
			},
			HttpStatus.BAD_REQUEST
		)
	}
}
