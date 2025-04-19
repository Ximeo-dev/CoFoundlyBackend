import { HttpException, HttpStatus } from '@nestjs/common'

export class NestNotFoundException extends HttpException {
	constructor(method: string, url: string) {
		super(
			{
				message: `Cannot ${method} ${url}`,
				error: 'Not Found',
				statusCode: HttpStatus.NOT_FOUND,
			},
			HttpStatus.NOT_FOUND
		)
	}
}
