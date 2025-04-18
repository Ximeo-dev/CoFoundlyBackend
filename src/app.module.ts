import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { UserModule } from './user/user.module'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'

@Module({
	imports: [ConfigModule.forRoot(), UserModule, AuthModule],
	controllers: [AppController],
})
export class AppModule {}
