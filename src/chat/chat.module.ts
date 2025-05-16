import { Module } from '@nestjs/common'
import { ChatService } from './chat.service'
import { ChatGateway } from './chat.gateway'
import { UserModule } from 'src/user/user.module'
import { AuthModule } from 'src/auth/auth.module'
import { ChatController } from './chat.controller'
import { ProfileModule } from 'src/profile/profile.module'

@Module({
	imports: [UserModule, AuthModule, ProfileModule],
	providers: [ChatGateway, ChatService],
	controllers: [ChatController],
})
export class ChatModule {}
