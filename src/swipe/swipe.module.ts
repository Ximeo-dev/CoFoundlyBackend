import { Module } from '@nestjs/common'
import { SwipeService } from './swipe.service'
import { SwipeController } from './swipe.controller'
import { ComputingService } from './computing.service'
import { ProfileModule } from 'src/profile/profile.module'
import { WebsocketModule } from 'src/ws/websocket.module'

@Module({
	imports: [ProfileModule, WebsocketModule],
	controllers: [SwipeController],
	providers: [SwipeService, ComputingService],
})
export class SwipeModule {}
