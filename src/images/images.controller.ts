import {
	Controller,
	Post,
	UseInterceptors,
	UploadedFile,
	Get,
	Param,
	Res,
	ParseIntPipe,
	BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { User } from '@prisma/client'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { ImageValidationPipe } from 'src/pipes/image-validation-pipe'
import { ImagesService } from './images.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Response } from 'express'

@Controller('images')
export class ImagesController {
	constructor(private readonly imagesService: ImagesService) {}

	@Post('avatar')
	@UseInterceptors(FileInterceptor('avatar'))
	@Auth()
	async uploadAvatar(
		@UploadedFile(ImageValidationPipe) file: Express.Multer.File,
		@CurrentUser() user: User,
		@Res() res: Response,
	) {
		await this.imagesService.processAndStoreAvatar(user.id, file.buffer)
		const url = this.imagesService.getAvatarUrl(user.id, 128)
		res.redirect(url)
	}

	@Get('avatar/:userId/:size')
	async getAvatar(
		@Param('userId') userId: string,
		@Param('size', ParseIntPipe) size: number,
		@Res() res: Response,
	) {
		const allowedSizes = [64, 128, 512]
		if (!allowedSizes.includes(size)) {
			throw new BadRequestException(
				'Неверный размер. Допустимые значения: 64, 128, 512',
			)
		}

		const url = this.imagesService.getAvatarUrl(userId, size)
		res.redirect(url)
	}
}
