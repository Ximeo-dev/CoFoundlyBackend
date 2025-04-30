import { forwardRef, Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { PrismaService } from 'src/prisma.service'
import { EmailModule } from 'src/email/email.module'
import { S3Service } from 'src/s3.service'

@Module({
	imports: [forwardRef(() => EmailModule)],
	controllers: [UserController],
	providers: [UserService, PrismaService],
	exports: [UserService],
})
export class UserModule {}
