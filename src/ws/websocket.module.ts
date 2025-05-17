import { Module } from '@nestjs/common'
import { AuthModule } from 'src/auth/auth.module'
import { ProfileModule } from 'src/profile/profile.module'
import { UserModule } from 'src/user/user.module'
import { ChatController } from './chat/chat.controller'
import { ChatGateway } from './chat/chat.gateway'
import { ChatService } from './chat/chat.service'
import { ConnectionGateway } from './connection.gateway'
import { NotificationsGateway } from './notifications/notifications.gateway'
import { WebsocketService } from './websocket.service'

@Module({
	imports: [UserModule, AuthModule, ProfileModule],
	providers: [
		WebsocketService,
		ConnectionGateway,
		ChatGateway,
		ChatService,
		NotificationsGateway,
	],
	controllers: [ChatController],
	exports: [WebsocketService, ChatService],
})
export class WebsocketModule {}
