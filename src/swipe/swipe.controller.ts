import {
	Body,
	Controller,
	Get,
	HttpCode,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common'
import { SwipeService } from './swipe.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { EnumValidationPipe } from 'src/pipes/enum-validation-pipe'
import { SwipeIntent } from './types/swipe.types'
import { SwipeDto } from './dto/swipe.dto'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'

@Controller('swipe')
@UseGuards(ThrottlerGuard)
export class SwipeController {
	constructor(private readonly swipeService: SwipeService) {}

	@Get()
	@Auth()
	async findCandidate(
		@CurrentUser('id') id: string,
		@Query('intent', new EnumValidationPipe(SwipeIntent)) intent: SwipeIntent,
	) {
		return this.swipeService.findCandidate(id, intent)
	}

	@HttpCode(200)
	@Post()
	@Auth()
	@Throttle({ default: { limit: 2, ttl: 1000 } })
	async handleSwipe(@CurrentUser('id') id: string, @Body() dto: SwipeDto) {
		return this.swipeService.handleSwipe(id, dto.toUserId, dto.action)
	}

	@HttpCode(200)
	@Post('reset')
	@Roles('ADMIN')
	@UseGuards(RolesGuard)
	@Auth()
	async resetSwipes(@CurrentUser('id') id: string) {
		return this.swipeService.resetSwipes(id)
	}
}
