import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { TwoFactorService } from 'src/two-factor/two-factor.service'
import { TwoFactorAction } from 'src/two-factor/types/two-factor.types'
import { REQUIRE_2FA_KEY } from '../decorators/two-factor.decorator'

@Injectable()
export class TwoFactorGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private twoFactorService: TwoFactorService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const action = this.reflector.getAllAndOverride<TwoFactorAction>(
			REQUIRE_2FA_KEY,
			[context.getHandler(), context.getClass()],
		)

		if (!action) return true

		const request = context.switchToHttp().getRequest()

		const userId = request.user?.id
		if (!userId) throw new UnauthorizedException()

		const forwarded = request.headers['x-forwarded-for'] as string
		const ip = forwarded ? forwarded.split(',')[0].trim() : request.ip
	
		const isIssued = await this.twoFactorService.issueAction(userId, action, ip)

		if (isIssued) throw new ForbiddenException('2FA confirmation required')

		return true
	}
}
