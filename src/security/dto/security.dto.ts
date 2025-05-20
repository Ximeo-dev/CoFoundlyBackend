import {
	IsEmail,
	IsNotEmpty,
	MinLength,
	IsString,
	Matches,
	MaxLength,
} from 'class-validator'

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

export class ResetPasswordRequestDto {
	@IsEmail()
	@IsNotEmpty()
	email: string
}

export class ResetPasswordConfirmDto {
	@IsString()
	@MinLength(8, {
		message: 'Пароль должен состоять минимум из 8 символов',
	})
	@MaxLength(128, {
		message: 'Длина пароля не должна превышать 128 символов',
	})
	@Matches(/^(?=.*[a-z])(?=.*\d)[A-Za-z\d!@#$&\s]{8,}$/, {
		message:
			'Password is too weak. It must contain at least one lowercase letter and one digit.',
	})
	password: string
}
