import { Controller } from '@nestjs/common'
import { SwipeService } from './swipe.service'

@Controller('swipe')
export class SwipeController {
	constructor(private readonly swipeService: SwipeService) {}
}
