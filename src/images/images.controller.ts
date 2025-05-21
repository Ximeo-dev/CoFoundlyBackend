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
	ParseUUIDPipe,
	Delete,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { ImageValidationPipe } from 'src/pipes/image-validation-pipe'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Response } from 'express'
import { ImagesService } from './images.service'
import { AVATAR_SIZES, MAX_AVATAR_FILESIZE } from 'src/constants/constants'
import { AvatarType } from './types/image.types'
import { EnumValidationPipe } from 'src/pipes/enum-validation-pipe'

@Controller('images')
export class ImagesController {
	private readonly responseHeaders = {
		'Content-Type': 'image/webp',
		'Cache-Control': 'public, max-age=31536000',
	}

	constructor(private readonly imagesService: ImagesService) {}

	@HttpCode(200)
	@Post('avatar/user')
	@UseInterceptors(
		FileInterceptor('avatar', {
			limits: { fileSize: MAX_AVATAR_FILESIZE + 1024 * 1024 }, // +1MB
		}),
	)
	@Auth()
	async uploadUserAvatar(
		@UploadedFile(ImageValidationPipe) file: Express.Multer.File,
		@CurrentUser('id') userId: string,
		@Res() res: Response,
	) {
		await this.imagesService.processAndStoreAvatar(
			userId,
			file.buffer,
			AvatarType.USER,
		)
		const stream = await this.imagesService.getAvatar(
			userId,
			512,
			AvatarType.USER,
		)

		res.set(this.responseHeaders)

		stream.pipe(res)
	}

	@HttpCode(200)
	@Post('avatar/project/:id')
	@UseInterceptors(
		FileInterceptor('avatar', {
			limits: { fileSize: MAX_AVATAR_FILESIZE + 1024 * 1024 }, // +1MB
		}),
	)
	@Auth()
	async uploadProjectAvatar(
		@UploadedFile(ImageValidationPipe) file: Express.Multer.File,
		@Param('id') id: string,
		@Res() res: Response,
	) {
		await this.imagesService.processAndStoreAvatar(
			id,
			file.buffer,
			AvatarType.PROJECT,
		)
		const stream = await this.imagesService.getAvatar(
			id,
			512,
			AvatarType.PROJECT,
		)

		res.set(this.responseHeaders)

		stream.pipe(res)
	}

	@HttpCode(200)
	@Delete('avatar/user')
	@Auth()
	async deleteUserAvatar(@CurrentUser('id') userId: string) {
		await this.imagesService.deleteAvatar(userId, AvatarType.USER)
		return true
	}

	@HttpCode(200)
	@Delete('avatar/project/:id')
	@Auth()
	async deleteAvatar(@Param('id') id: string) {
		await this.imagesService.deleteAvatar(id, AvatarType.PROJECT)
		return true
	}

	@Get('avatar/:type/:id/:size')
	async getAvatar(
		@Param('type', new EnumValidationPipe(AvatarType)) type: AvatarType,
		@Param('id', ParseUUIDPipe) id: string,
		@Param('size', ParseIntPipe) size: number,
		@Res() res: Response,
	) {
		if (!AVATAR_SIZES.includes(size)) {
			throw new BadRequestException(
				`Invalid avatar size. Allowed values: ${AVATAR_SIZES.join(', ')}`,
			)
		}

		const stream = await this.imagesService.getAvatar(id, size, type)

		res.set(this.responseHeaders)

		stream.pipe(res)
	}
}
