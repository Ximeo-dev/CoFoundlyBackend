import { forwardRef, Module } from '@nestjs/common'
import { EmailModule } from 'src/email/email.module'
import { PrismaService } from 'src/prisma/prisma.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
	imports: [forwardRef(() => EmailModule)],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
