import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { S3Service } from 'src/s3.service'
import { PrismaService } from 'src/prisma.service'

@Module({
  controllers: [ImagesController],
  providers: [ImagesService, S3Service, PrismaService],
})
export class ImagesModule {}
