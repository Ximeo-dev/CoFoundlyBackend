import {
	forwardRef,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common'
import * as sharp from 'sharp'
import { S3FileNotFoundException } from 'src/exceptions/S3FileNotFoundException'
import { ProjectProfileService } from 'src/profile/project-profile.service'
import { UserProfileService } from 'src/profile/user-profile.service'
import { S3Service } from 'src/s3/s3.service'
import { AvatarType } from './types/image.types'
import { AVATAR_SIZES } from 'src/constants/constants'

@Injectable()
export class ImagesService {
	private logger: Logger = new Logger(ImagesService.name)

	constructor(
		private readonly S3Service: S3Service,
		@Inject(forwardRef(() => UserProfileService))
		private readonly userProfileService: UserProfileService,
		private readonly projectProfileService: ProjectProfileService,
	) {}

	async processAndStoreAvatar(id: string, buffer: Buffer, type: AvatarType) {
		if (type === AvatarType.USER) {
			const profile = await this.userProfileService.getUserProfile(id)

			if (!profile) throw new NotFoundException('User profile not found')
		} else if (type === AvatarType.PROJECT) {
			const project = await this.projectProfileService.getProjectById(id)

			if (!project) throw new NotFoundException('Project not found')
		}

		const baseKey = `avatars/${type}/${id}`

		await Promise.all(
			AVATAR_SIZES.map((size) =>
				this.S3Service.delete(`${baseKey}-${size}.webp`).catch(() => null),
			),
		)

		try {
			const uploadTasks = AVATAR_SIZES.map(async (size) => {
				const resizedBuffer = await sharp(buffer)
					.resize(size, size)
					.webp({ quality: 90 })
					.toBuffer()

				const key = `${baseKey}-${size}.webp`
				await this.S3Service.uploadPublic(key, resizedBuffer, 'image/webp')
			})

			await Promise.all(uploadTasks)

			if (type === AvatarType.USER) {
				await this.userProfileService.setHasAvatar(id, true)
			} else if (type === AvatarType.PROJECT) {
				await this.projectProfileService.setHasAvatar(id, true)
			}

			return true
		} catch (error) {
			this.logger.error('Avatar loading error:', error)
			return false
		}
	}

	async deleteAvatar(id: string, type: AvatarType) {
		const baseKey = `avatars/${type}/${id}`

		const results = await Promise.all(
			AVATAR_SIZES.map((size) =>
				this.S3Service.delete(`${baseKey}-${size}.webp`)
					.then(() => true)
					.catch(() => false),
			),
		)

		return results.some((r) => r)
	}

	async getAvatar(id: string, size: number, type: AvatarType) {
		if (type === AvatarType.USER) {
			const profile = await this.userProfileService.getUserProfile(id)

			if (!profile) throw new S3FileNotFoundException('User profile not found')
		} else if (type === AvatarType.PROJECT) {
			const project = await this.projectProfileService.getProjectById(id)

			if (!project) throw new S3FileNotFoundException('Project not found')
		}

		let key = `avatars/${type}/${id}-${size}.webp`

		return this.S3Service.getFileStream(key)
	}
}
