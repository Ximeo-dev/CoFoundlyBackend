import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
	private client: Redis

	constructor(private configService: ConfigService) {}

	onModuleInit() {
		this.client = new Redis({
			host: this.configService.getOrThrow<string>('REDIS_HOST'),
			port: this.configService.getOrThrow<number>('REDIS_PORT'),
			password: this.configService.getOrThrow<string>('REDIS_PASSWORD'),
		})

		this.client.on('connect', () => console.log('[Redis] Connected'))
		this.client.on('error', (err) => console.error('[Redis] Error:', err))
	}

	onModuleDestroy() {
		return this.client.quit()
	}

	async set(key: string, value: string, ttlSeconds?: number) {
		if (ttlSeconds) {
			await this.client.set(key, value, 'EX', ttlSeconds)
		} else {
			await this.client.set(key, value)
		}
	}

	async get(key: string): Promise<string | null> {
		return this.client.get(key)
	}

	async mget(keys: string[]): Promise<(string | null)[]> {
		return this.client.mget(keys)
	}

	async del(key: string): Promise<number> {
		return this.client.del(key)
	}

	async listPush<T>(key: string, elements: T[]): Promise<number> {
		if (!elements.length) return 0
		const serialized = elements.map((e) => JSON.stringify(e))
		return this.client.lpush(key, ...serialized)
	}

	async listGet<T>(key: string, start = 0, stop = -1): Promise<T[]> {
		const items = await this.client.lrange(key, start, stop)
		return items.map((item) => JSON.parse(item) as T)
	}

	async exists(key: string): Promise<boolean> {
		const result = await this.client.exists(key)
		return result === 1
	}

	async ttl(key: string): Promise<number> {
		return this.client.ttl(key)
	}

	async setObject<T>(
		key: string,
		value: T,
		ttlSeconds?: number,
	): Promise<void> {
		try {
			const json = JSON.stringify(value)
			await this.set(key, json, ttlSeconds)
		} catch (error) {
			console.error(`[Redis] Failed to stringify value for key ${key}:`, error)
			throw new Error('Failed to store object in Redis')
		}
	}

	async getObject<T>(key: string): Promise<T | null> {
		try {
			const value = await this.get(key)
			if (!value) return null
			return JSON.parse(value) as T
		} catch (error) {
			console.error(`[Redis] Failed to parse JSON for key ${key}:`, error)
			return null
		}
	}
}
