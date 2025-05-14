import { Module } from '@nestjs/common'
import { ImagesController } from './images.controller'
import { ImagesService } from './images.service'
import { S3Module } from 'src/s3/s3.module'
import { ProfileModule } from 'src/profile/profile.module'

@Module({
	imports: [ProfileModule, S3Module],
	controllers: [ImagesController],
	providers: [ImagesService],
})
export class ImagesModule {}
