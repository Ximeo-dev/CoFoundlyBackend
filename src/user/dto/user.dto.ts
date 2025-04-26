import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'
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
	name: string

	@Expose()
	age: number

	@Expose()
	avatarUrl: string | null

	@Expose()
	createdAt: string

	@Expose()
	@Type(() => SecuritySettingsDto)
	securitySettings: SecuritySettingsDto
}