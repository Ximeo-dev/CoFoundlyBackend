import { Module } from '@nestjs/common'
import { UserModule } from 'src/user/user.module'
import { ImagesController } from './images.controller'
import { ImagesService } from './images.service'
import { S3Module } from 'src/s3/s3.module'

@Module({
	imports: [UserModule, S3Module],
	controllers: [ImagesController],
	providers: [ImagesService],
})
export class ImagesModule {}
