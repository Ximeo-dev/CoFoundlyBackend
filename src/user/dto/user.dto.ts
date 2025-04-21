import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

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