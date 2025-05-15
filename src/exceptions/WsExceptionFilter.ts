import { ArgumentsHost, Catch } from '@nestjs/common'
import { BaseWsExceptionFilter } from '@nestjs/websockets'
import { ValidationError } from 'class-validator'

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const client = host.switchToWs().getClient()
		let message = 'Internal server error'
		let status = 'error'

		if (
			exception instanceof ValidationError ||
			Array.isArray(exception?.response?.message)
		) {
			message = exception.response?.message?.join(', ') || 'Validation failed'
			status = 'validation_error'
		} else if (exception.message) {
			message = exception.message
		}

		client.emit('errors', { status, message })
	}
}
