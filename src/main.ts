import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as cookieParser from 'cookie-parser'
import { NestExpressApplication } from '@nestjs/platform-express'
import { getEnvVar } from './utils/env'
import { ValidationPipe } from '@nestjs/common'
import * as dotenv from 'dotenv'
import * as dotenvExpand from 'dotenv-expand'
import { CustomSocketIoAdapter } from './middlewares/custom-socket-adapter'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AuthModule } from './auth/auth.module'
import { ProfileModule } from './profile/profile.module'
import { EntitiesModule } from './entities/entities.module'
import { SecurityModule } from './security/security.module'
import { WebsocketModule } from './ws/websocket.module'
import { SwipeModule } from './swipe/swipe.module'

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

	const swaggerConfig = new DocumentBuilder()
		.setTitle('CoFoundly RESTful API')
		.setVersion('1.0.0')
		.addBearerAuth()
		.build()

	const document = SwaggerModule.createDocument(app, swaggerConfig, {
		include: [
			AuthModule,
			ProfileModule,
			EntitiesModule,
			SecurityModule,
			WebsocketModule,
			SwipeModule,
		],
	})

	SwaggerModule.setup('/docs', app, document)

	await app.listen(getEnvVar('PORT'))
}
bootstrap()
