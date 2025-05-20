import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as cookieParser from 'cookie-parser'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import * as dotenv from 'dotenv'
import * as dotenvExpand from 'dotenv-expand'
import { ConfigService } from '@nestjs/config'
import { CORS_ORIGIN_LIST } from './constants/constants'

async function bootstrap() {
	;(BigInt.prototype as any).toJSON = function () {
		return this.toString()
	}

	const myEnv = dotenv.config()
	dotenvExpand.expand(myEnv)

	const app = await NestFactory.create<NestExpressApplication>(AppModule)

	app.disable('x-powered-by', 'X-Powered-By')
	app.use(cookieParser())
	app.enableCors({
		credentials: true,
		exposedHeaders: 'set-cookie',
		origin: CORS_ORIGIN_LIST,
	})

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
		}),
	)

	const config = app.get(ConfigService)

	await app.listen(config.getOrThrow('PORT'))
}
bootstrap()
