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
import { NotificationsController } from './notifications/notifications.controller'
import { NotificationsService } from './notifications/notifications.service'

@Module({
	imports: [UserModule, AuthModule, ProfileModule],
	providers: [
		WebsocketService,
		ConnectionGateway,
		ChatGateway,
		ChatService,
		NotificationsGateway,
		NotificationsService,
	],
	controllers: [ChatController, NotificationsController],
	exports: [WebsocketService, ChatService, NotificationsService],
})
export class WebsocketModule {}
