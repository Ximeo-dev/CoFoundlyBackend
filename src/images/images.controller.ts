import { Controller, Post, UseInterceptors, UploadedFile, Get, Param } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { User } from '@prisma/client'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { ImageValidationPipe } from 'src/pipes/image-validation-pipe'
import { ImagesService } from './images.service'
import { Auth } from 'src/auth/decorators/auth.decorator'

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @Auth()
  async uploadAvatar(
    @UploadedFile(ImageValidationPipe) file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    await this.imagesService.processAndStoreAvatar(user.id, file.buffer)
    return this.imagesService.getAvatarUrl(user.id, 128)
  }

  @Get('avatar/:userId/:size')
  async getAvatar(
    @Param('userId') userId: string,
    @Param('size') size: '64' | '128' | '512',
  ) {
    return this.imagesService.getAvatarUrl(userId, Number(size))
  }
}
