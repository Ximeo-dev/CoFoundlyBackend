import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { Expose, Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateUserDto {
	@IsOptional()
	@IsString()
	@Expose()
	@IsNotEmpty()
	name?: string

	@IsOptional()
	@IsNumber()
	@Expose()
	@IsNotEmpty()
	age?: number
}

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
	createdAt: string

	@ApiProperty()
	@Expose()
	@Type(() => SecuritySettingsDto)
	securitySettings: SecuritySettingsDto
}
