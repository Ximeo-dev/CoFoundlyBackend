import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as cookieParser from 'cookie-parser'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import * as dotenv from 'dotenv'
import * as dotenvExpand from 'dotenv-expand'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AuthModule } from './auth/auth.module'
import { ProfileModule } from './profile/profile.module'
import { EntitiesModule } from './entities/entities.module'
import { SecurityModule } from './security/security.module'
import { WebsocketModule } from './ws/websocket.module'
import { SwipeModule } from './swipe/swipe.module'
import { ConfigService } from '@nestjs/config'
import { CORS_ORIGIN_LIST } from './constants/constants'
import helmet from 'helmet'

async function bootstrap() {
	;(BigInt.prototype as any).toJSON = function () {
		return this.toString()
	}

	const myEnv = dotenv.config()
	dotenvExpand.expand(myEnv)

	const app = await NestFactory.create<NestExpressApplication>(AppModule)
	const config = app.get(ConfigService)

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

	app.use(
		helmet({
			contentSecurityPolicy: {
				useDefaults: true,
				directives: {
					defaultSrc: ["'self'"],
					scriptSrc: ["'self'"],
					imgSrc: ["'self'", 'data:', 'blob:'],
					connectSrc: [
						"'self'",
						`wss://${config.getOrThrow<string>('API_URL')}`,
						`https://${config.getOrThrow<string>('API_URL')}`,
					],
					frameAncestors: ["'none'"],
					objectSrc: ["'none'"],
					upgradeInsecureRequests: [],
				},
			},

			referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
			crossOriginEmbedderPolicy: false,
			crossOriginResourcePolicy: { policy: 'same-site' },
			dnsPrefetchControl: { allow: true },
			frameguard: { action: 'deny' },
			hidePoweredBy: true,
			hsts: {
				maxAge: 63072000, // 2 года
				includeSubDomains: true,
				preload: true,
			},
			ieNoOpen: true,
			noSniff: true,
			permittedCrossDomainPolicies: { permittedPolicies: 'none' },
			xssFilter: true,
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

	await app.listen(config.getOrThrow('PORT'))
}
bootstrap()
