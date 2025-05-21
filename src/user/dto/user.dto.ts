import { Expose, Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class SecuritySettingsDto {
	@ApiProperty({ example: true })
	@Expose()
	isEmailConfirmed: boolean

	@ApiProperty({ example: true })
	@Expose()
	twoFactorEnabled: boolean

	@ApiProperty({ example: '123456789', nullable: true, type: String })
	@Expose()
	telegramId: string | null
}

export class UserResponseDto {
	@ApiProperty({ example: 'uuidv4' })
	@Expose()
	id: string

	@ApiProperty({ example: 'user@example.com' })
	@Expose()
	email: string

	@ApiProperty({ example: 'username' })
	@Expose()
	username: string

	@ApiProperty({ example: 'UserName' })
	@Expose()
	displayUsername: string

	@ApiProperty({ example: 'timestamp' })
	@Expose()
	createdAt: Date

	@ApiProperty()
	@Expose()
	@Type(() => SecuritySettingsDto)
	securitySettings: SecuritySettingsDto
}
