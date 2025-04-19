import {
	CanActivate,
	ExecutionContext,
	Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '@prisma/client'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { NestNotFoundException } from 'src/exceptions/NestNotFoundException'

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()]
		)

		if (!requiredRoles) {
			return true
		}

		const request = context.switchToHttp().getRequest()
		const user = request.user

		if (!user || !user.role || !requiredRoles.includes(user.role)) {
			throw new NestNotFoundException(request.method, request.url)
		}

		return true
	}
}
