import { Module } from '@nestjs/common'
import { ImagesService } from './images.service'
import { ImagesController } from './images.controller'
import { S3Service } from 'src/s3.service'
import { UserModule } from 'src/user/user.module'

@Module({
	imports: [UserModule],
	controllers: [ImagesController],
	providers: [ImagesService, S3Service],
})
export class ImagesModule {}
