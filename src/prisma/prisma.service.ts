import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	async onModuleInit() {
		try {
			await this.$connect()
			console.log('[Prisma] Database connected')
		} catch (error) {
			console.error('[Prisma] Error:', error)
		}
	}
}