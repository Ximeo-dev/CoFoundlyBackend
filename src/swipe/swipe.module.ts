import { Module } from '@nestjs/common'
import { SwipeService } from './swipe.service'
import { SwipeController } from './swipe.controller'
import { ComputingService } from './computing.service'
import { ProfileModule } from 'src/profile/profile.module'

@Module({
	imports: [ProfileModule],
	controllers: [SwipeController],
	providers: [SwipeService, ComputingService],
})
export class SwipeModule {}
