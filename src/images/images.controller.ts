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
	HttpCode,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { ImageValidationPipe } from 'src/pipes/image-validation-pipe'
import { AVATAR_SIZES, ImagesService } from './images.service'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Response } from 'express'

@Controller('images')
export class ImagesController {
	constructor(private readonly imagesService: ImagesService) {}

	@HttpCode(200)
	@Post('avatar')
	@UseInterceptors(
		FileInterceptor('avatar', {
			limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
		}),
	)
	@Auth()
	async uploadAvatar(
		@UploadedFile(ImageValidationPipe) file: Express.Multer.File,
		@CurrentUser('id') userId: string,
		@Res() res: Response,
	) {
		await this.imagesService.processAndStoreAvatar(userId, file.buffer)
		const stream = await this.imagesService.getAvatar(userId, 512)

		res.set({
			'Content-Type': 'image/webp',
			'Cache-Control': 'public, max-age=31536000',
		})

		stream.pipe(res)
	}

	@Get('avatar/:userId/:size')
	async getAvatar(
		@Param('userId') userId: string,
		@Param('size', ParseIntPipe) size: number,
		@Res() res: Response,
	) {
		if (!AVATAR_SIZES.includes(size)) {
			throw new BadRequestException(
				'Неверный размер. Допустимые значения: 64, 128, 512',
			)
		}

		const stream = await this.imagesService.getAvatar(userId, size)

		res.set({
			'Content-Type': 'image/webp',
			'Cache-Control': 'public, max-age=31536000',
		})

		stream.pipe(res)
	}
}
