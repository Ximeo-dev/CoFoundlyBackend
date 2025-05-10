import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common'
import { SwipeService } from './swipe.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { EnumValidationPipe } from 'src/pipes/enum-validation-pipe'
import { SwipeIntent } from './types/swipe.types'
import { SwipeDto } from './dto/swipe.dto'

@Controller('swipe')
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
	async handleSwipe(@CurrentUser('id') id: string, @Body() dto: SwipeDto) {
		return this.swipeService.handleSwipe(id, dto.toUserId, dto.action)
	}

	@HttpCode(200)
	@Post('reset')
	@Auth()
	async resetSwipes(@CurrentUser('id') id: string) {
		return this.swipeService.resetSwipes(id)
	}
}
