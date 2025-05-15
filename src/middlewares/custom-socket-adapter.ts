import { IoAdapter } from '@nestjs/platform-socket.io'
import { Server } from 'socket.io'

export class CustomSocketIoAdapter extends IoAdapter {
	constructor(app: any) {
		super(app)
	}

	createIOServer(port: number, options?: any): Server {
		const server: Server = super.createIOServer(port, options)

		server.of('/').on('connection', (socket) => {
			socket.emit('error', 'Root namespace is forbidden')
			socket.disconnect(true)
		})

		return server
	}
}
