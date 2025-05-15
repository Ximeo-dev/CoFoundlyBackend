import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as cookieParser from 'cookie-parser'
import { NestExpressApplication } from '@nestjs/platform-express'
import { getEnvVar } from './utils/env'
import { ValidationPipe } from '@nestjs/common'
import * as dotenv from 'dotenv'
import * as dotenvExpand from 'dotenv-expand'
import { CustomSocketIoAdapter } from './middlewares/custom-socket-adapter'

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
		origin: ['http://localhost:3000', 'https://cofoundly.infinitum.su'],
	})

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // удаляет неизвестные поля
			// forbidNonWhitelisted: true, // выбрасывает ошибку, если поле неизвестно
			transform: true,
		}),
	)

	app.useWebSocketAdapter(new CustomSocketIoAdapter(app))

	await app.listen(getEnvVar('PORT'))
}
bootstrap()
