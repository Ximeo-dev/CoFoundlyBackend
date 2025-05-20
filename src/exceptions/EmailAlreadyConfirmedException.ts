import { HttpException, HttpStatus } from '@nestjs/common'

export class EmailAlreadyConfirmedException extends HttpException {
	constructor() {
		super(
			{
				message: 'Email already confirmed',
			},
			HttpStatus.BAD_REQUEST,
		)
	}
}
