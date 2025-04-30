import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import * as sharp from 'sharp'

@Injectable()
export class ImageValidationPipe implements PipeTransform {
	async transform(file: Express.Multer.File): Promise<Express.Multer.File> {
		if (!file) {
			throw new BadRequestException('Файл не передан')
		}

		// 1. Проверка размера (до 2MB)
		const MAX_SIZE = 2 * 1024 * 1024 // 2MB
		if (file.size > MAX_SIZE) {
			throw new BadRequestException('Максимальный допустимый размер файла 2MB')
		}

		// 2. Проверка формата
		const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
		if (!allowedMimeTypes.includes(file.mimetype)) {
			throw new BadRequestException(`Недопустимый формат изображения. Разрешённые форматы: ${allowedMimeTypes.map((format) => format.split('/')[1]).join(', ')}`)
		}

		// 3. Проверка разрешения
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
