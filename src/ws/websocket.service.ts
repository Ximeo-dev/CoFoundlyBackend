import { Injectable } from '@nestjs/common'
import { Server } from 'socket.io'
import { ChatServerEvent, ServerEvents } from './types/events'

@Injectable()
export class WebsocketService {
	private _server: Server

	setServer(server: Server) {
		this._server = server
	}

	get server(): Server {
		return this._server
	}

	emitToUser(userId: string, event: ServerEvents, payload: any) {
		this._server.to(userId).emit(event, payload)
	}

	emitToRoom(roomId: string, event: ChatServerEvent, payload: any) {
		this._server.to(roomId).emit(event, payload)
	}
}
