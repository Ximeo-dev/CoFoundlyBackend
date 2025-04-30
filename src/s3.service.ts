import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class S3Service {
	private readonly s3Client: S3Client
	private readonly bucket: string
	private readonly region: string
	private readonly accessKeyId: string
	private readonly secretAccessKey: string
	private readonly endpoint: string

	constructor(private readonly configService: ConfigService) {
		this.bucket = this.configService.getOrThrow<string>('S3_BUCKET')
		this.region = this.configService.getOrThrow<string>('S3_REGION')
		this.accessKeyId = this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID')
		this.secretAccessKey = this.configService.getOrThrow<string>(
			'S3_SECRET_ACCESS_KEY',
		)
		this.endpoint = 'https://storage.yandexcloud.net'
		this.s3Client = new S3Client({
			region: this.region,
			credentials: {
				accessKeyId: this.accessKeyId,
				secretAccessKey: this.secretAccessKey,
			},
			endpoint: this.endpoint,
		})
	}

	async uploadPublic(key: string, buffer: Buffer, contentType: string) {
		await this.s3Client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: buffer,
				ContentType: contentType,
				ACL: 'public-read',
			}),
		)
	}

	async delete(key: string) {
		await this.s3Client.send(
			new DeleteObjectCommand({
				Bucket: this.bucket,
				Key: key,
			}),
		)
	}

	getPublicUrl(key: string): string {
		return `${this.endpoint}/${this.bucket}/${key}`
	}
}
