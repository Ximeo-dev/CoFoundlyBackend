import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator'
import { Expose, Type } from 'class-transformer'
import { Flatten } from 'src/utils/flatten-transformer'

export class ChangeEmailDto {
	@IsString()
	@MinLength(8, {
		message: 'Пароль должен состоять минимум из 8 символов',
	})
	currentPassword: string

	@IsEmail()
	@IsNotEmpty()
	newEmail: string
}

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