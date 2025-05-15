import { Module } from '@nestjs/common'
import { ChatService } from './chat.service'
import { ChatGateway } from './chat.gateway'
import { UserModule } from 'src/user/user.module'
import { AuthModule } from 'src/auth/auth.module'

@Module({
	imports: [UserModule, AuthModule],
	providers: [ChatGateway, ChatService],
})
export class ChatModule {}
