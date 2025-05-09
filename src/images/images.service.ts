import { Injectable, NotFoundException } from '@nestjs/common'
import * as sharp from 'sharp'
import { S3FileNotFoundException } from 'src/exceptions/S3FileNotFoundException'
import { ProfileService } from 'src/profile/profile.service'
import { S3Service } from 'src/s3/s3.service'

export const AVATAR_SIZES = [512, 128, 64]

@Injectable()
export class ImagesService {
	constructor(
		private readonly S3Service: S3Service,
		private readonly profileService: ProfileService,
	) {}

	async processAndStoreAvatar(userId: string, buffer: Buffer) {
		const profile = await this.profileService.getUserProfile(userId)

		if (!profile) throw new NotFoundException('User profile not found')

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
	}

	async deleteAvatar(userId: string) {
		const profile = await this.profileService.getUserProfile(userId)

		if (!profile) throw new NotFoundException('User profile not found')

		const baseKey = `avatars/${userId}`

		await Promise.all(
			AVATAR_SIZES.map((size) =>
				this.S3Service.delete(`${baseKey}-${size}.webp`).catch(() => null),
			),
		)
	}

	async getAvatar(userId: string, size: number) {
		const profile = await this.profileService.getUserProfile(userId)

		if (!profile) throw new S3FileNotFoundException('User profile not found')

		let key = `avatars/${userId}-${size}.webp`

		return this.S3Service.getFileStream(key)
	}
}
