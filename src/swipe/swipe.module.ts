import { Module } from '@nestjs/common'
import { SwipeService } from './swipe.service'
import { SwipeController } from './swipe.controller'
import { ComputingService } from './computing.service'

@Module({
	imports: [],
	controllers: [SwipeController],
	providers: [SwipeService, ComputingService],
})
export class SwipeModule {}
