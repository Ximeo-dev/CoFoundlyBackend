import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { NestNotFoundException } from 'src/exceptions/NestNotFoundException'

@Injectable()
export class RolesJwtAuthGuard extends AuthGuard('jwt') {
	handleRequest(err, user, info, context: ExecutionContext) {
		if (err || !user) {
			const request = context.switchToHttp().getRequest()
			throw err || new NestNotFoundException(request.method, request.url)
		}
		return user
	}
}
