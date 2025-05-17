import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { Expose, Type } from 'class-transformer'

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
	@Expose()
	isEmailConfirmed: boolean

	@Expose()
	twoFactorEnabled: boolean

	@Expose()
	telegramId: string
}

export class UserResponseDto {
	@Expose()
	id: string

	@Expose()
	email: string

	@Expose()
	username: string

	@Expose()
	displayUsername: string

	@Expose()
	createdAt: string

	@Expose()
	@Type(() => SecuritySettingsDto)
	securitySettings: SecuritySettingsDto
}
