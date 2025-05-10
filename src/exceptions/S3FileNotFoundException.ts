import { HttpException, HttpStatus } from '@nestjs/common'

export class S3FileNotFoundException extends HttpException {
	constructor(message: string) {
		super(
			{
				message,
			},
			HttpStatus.OK,
		)
	}
}
