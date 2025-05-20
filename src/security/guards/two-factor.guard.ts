import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { TwoFactorService } from 'src/security/two-factor.service'
import { TwoFactorAction } from 'src/security/types/two-factor.types'
import { REQUIRE_2FA_KEY } from '../decorators/two-factor.decorator'
import { hasSecuritySettings } from 'src/user/types/user.guards'
import { UserWithSecurity } from 'src/user/types/user.types'

@Injectable()
export class TwoFactorGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly twoFactorService: TwoFactorService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const action = this.reflector.getAllAndOverride<TwoFactorAction>(
			REQUIRE_2FA_KEY,
			[context.getHandler(), context.getClass()],
		)

		if (!action) return true

		const request = context.switchToHttp().getRequest()

		const user: UserWithSecurity = request.user

		if (!user || !hasSecuritySettings(user)) throw new UnauthorizedException()

		const userId = user.id

		if (!user.securitySettings.twoFactorEnabled) return true

		const forwarded = request.headers['x-forwarded-for'] as string
		const ip = forwarded ? forwarded.split(',')[0].trim() : request.ip

		const isIssued = await this.twoFactorService.issue2FAAction(
			userId,
			action,
			ip,
		)

		if (isIssued) throw new ForbiddenException('2FA confirmation required')

		return true
	}
}
