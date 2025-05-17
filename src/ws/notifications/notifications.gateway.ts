import { UseFilters } from '@nestjs/common'
import { WebSocketGateway } from '@nestjs/websockets'
import { WsExceptionFilter } from 'src/exceptions/WsExceptionFilter'

@WebSocketGateway({
	namespace: '/',
})
@UseFilters(WsExceptionFilter)
export class NotificationsGateway {
	
}
