import { Module } from '@nestjs/common'
import { SwipeService } from './swipe.service'
import { SwipeController } from './swipe.controller'
import { UserModule } from 'src/user/user.module'

@Module({
  imports: [],
	controllers: [SwipeController],
	providers: [SwipeService],
})
export class SwipeModule {}
