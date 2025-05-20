import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import * as sharp from 'sharp'
import { MAX_AVATAR_FILESIZE } from 'src/constants/constants'

@Injectable()
export class ImageValidationPipe implements PipeTransform {
	async transform(file: Express.Multer.File): Promise<Express.Multer.File> {
		if (!file) {
			throw new BadRequestException('Файл не передан')
		}

		if (file.size > MAX_AVATAR_FILESIZE) {
			throw new BadRequestException('Максимальный допустимый размер файла 3МБ')
		}

		const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
		if (!allowedMimeTypes.includes(file.mimetype)) {
			throw new BadRequestException(
				`Недопустимый формат изображения. Разрешённые форматы: ${allowedMimeTypes.map((format) => format.split('/')[1]).join(', ')}`,
			)
		}

		const metadata = await sharp(file.buffer).metadata()
		if (!metadata.width || !metadata.height) {
			throw new BadRequestException('Невозможно определить размер изображения')
		}

		if (metadata.width < 512 || metadata.height < 512) {
			throw new BadRequestException(
				'Минимальный размер изображения — 512x512 пикселей',
			)
		}

		return file
	}
}
