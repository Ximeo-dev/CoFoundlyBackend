import { Injectable, NotFoundException } from '@nestjs/common'
import * as sharp from 'sharp'
import { S3Service } from 'src/s3.service'
import { UserService } from 'src/user/user.service'

export const AVATAR_SIZES = [512, 128, 64]

@Injectable()
export class ImagesService {
	constructor(
		private readonly S3Service: S3Service,
		private readonly userService: UserService,
	) {}

	async processAndStoreAvatar(userId: string, buffer: Buffer) {
		const baseKey = `avatars/${userId}`

		await Promise.all(
			AVATAR_SIZES.map((size) =>
				this.S3Service.delete(`${baseKey}-${size}.webp`).catch(() => null),
			),
		)

		const uploadTasks = AVATAR_SIZES.map(async (size) => {
			const resizedBuffer = await sharp(buffer)
				.resize(size, size)
				.webp({ quality: 90 })
				.toBuffer()

			const key = `${baseKey}-${size}.webp`
			await this.S3Service.uploadPublic(key, resizedBuffer, 'image/webp')
		})

		await Promise.all(uploadTasks)

		const key512 = `${baseKey}-512.webp`
		const avatarUrl = this.S3Service.getPublicUrl(key512)

		await this.userService.setUserAvatar(userId, avatarUrl)
	}

	async getAvatar(userId: string, size: number) {
		const user = await this.userService.getById(userId)

		if (!user) throw new NotFoundException('User not found')

		let key = `avatars/${userId}-${size}.webp`

		if (!user.avatarUrl) throw new NotFoundException('User avatar not found')

		return this.S3Service.getFileStream(key)
	}
}
