import { Logger, UseFilters } from '@nestjs/common'
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets'
import { AuthSocketService } from 'src/auth/socket/auth-socket.service'
import { WsExceptionFilter } from 'src/exceptions/WsExceptionFilter'
import { AuthenticatedSocket } from './types/socket.types'
import { ChatService } from './chat/chat.service'
import { Server } from 'socket.io'
import { WebsocketService } from './websocket.service'
import {
	CORS_ORIGIN_LIST,
	SOCKET_CONNECTIONS_PER_IP,
	SOCKET_CONNECTIONS_PER_USER,
} from 'src/constants/constants'
import { RedisService } from 'src/redis/redis.service'

@WebSocketGateway({
	namespace: '/',
	cors: {
		origin: CORS_ORIGIN_LIST,
	},
})
@UseFilters(WsExceptionFilter)
export class ConnectionGateway
	implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
	private logger: Logger = new Logger(ConnectionGateway.name)
	@WebSocketServer() server: Server

	constructor(
		private readonly websocketService: WebsocketService,
		private readonly authSocketService: AuthSocketService,
		private readonly chatService: ChatService,
		private readonly redis: RedisService,
	) {}

	private getUserConnectionsKey(userId: string) {
		return `ws:connections:user:${userId}`
	}

	private getIpConnectionsKey(ip: string) {
		return `ws:connections:ip:${ip}`
	}

	async handleConnection(client: AuthenticatedSocket) {
		this.logger.debug(`Client connecting: Client ID - ${client.id}`)
		await this.authSocketService.attachUserToSocket(client)
		const userId = client?.user?.id

		if (!userId || client.disconnected) return

		const userConnectionsKey = this.getUserConnectionsKey(userId)
		const ip = client.handshake.address
		const ipConnectionsKey = this.getIpConnectionsKey(ip)

		const userConnections = await this.redis.smembers(userConnectionsKey)
		const ipConnections = await this.redis.smembers(ipConnectionsKey)

		if (userConnections.length >= SOCKET_CONNECTIONS_PER_USER) {
			const oldSocketId = userConnections[0]

			this.server
				.to(oldSocketId)
				.emit('errors', 'Disconnected due to new connection')
			this.server.to(oldSocketId).disconnectSockets(true)
		}

		if (ipConnections.length >= SOCKET_CONNECTIONS_PER_IP) {
			const oldSocketId = ipConnections[0]

			this.server
				.to(oldSocketId)
				.emit('errors', 'Disconnected due to many connections from this IP')
			this.server.to(oldSocketId).disconnectSockets(true)
		}

		await this.redis.sadd(userConnectionsKey, client.id)
		await this.redis.sadd(ipConnectionsKey, client.id)

		client.join(userId)
		const chats = await this.chatService.getUserDirectChats(userId)
		chats.forEach((chat) => {
			client.join(chat.id)
		})
		this.logger.debug(`Client connected: User ID - ${userId}`)
	}

	async handleDisconnect(client: AuthenticatedSocket) {
		const userId = client?.user?.id
		if (userId) {
			const userConnectionsKey = this.getUserConnectionsKey(userId)
			const ip = client.handshake.address
			const ipConnectionsKey = this.getIpConnectionsKey(ip)

			await this.redis.srem(userConnectionsKey, client.id)
			await this.redis.srem(ipConnectionsKey, client.id)

			if ((await this.redis.scard(userConnectionsKey)) === 0) {
				await this.redis.del(userConnectionsKey)
			}

			if ((await this.redis.scard(ipConnectionsKey)) === 0) {
				await this.redis.del(ipConnectionsKey)
			}

			this.logger.debug(`Client disconnected: User ID - ${client.user.id}`)
		} else {
			this.logger.debug(`Client disconnected: Client ID - ${client.id}`)
		}
	}

	afterInit() {
		this.websocketService.setServer(this.server)
	}
}
