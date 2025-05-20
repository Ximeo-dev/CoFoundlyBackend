import {
	IsEmail,
	IsNotEmpty,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator'

export class RegisterDto {
	@IsEmail()
	@IsNotEmpty()
	email: string

	@IsNotEmpty()
	@MinLength(4, {
		message: 'Имя пользователя должно состоять минимум из 4 символов',
	})
	@MaxLength(16, {
		message: 'Имя пользователя должно содержать не более 16 символов',
	})
	@IsString()
	@Matches(/^[a-zA-Z0-9_-]+$/, {
		message:
			'Имя пользователя может состоять только из букв английского алфавита, цифр, _, -',
	})
	username: string

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

export class EmailAvailableDto {
	@IsEmail()
	@IsNotEmpty()
	email: string
}

export class UsernameAvailableDto {
	@IsString()
	@MinLength(4, {
		message: 'Имя пользователя должно состоять минимум из 4 символов',
	})
	@MaxLength(16, {
		message: 'Имя пользователя должно содержать не более 16 символов',
	})
	@Matches(/^[a-zA-Z0-9_-]+$/, {
		message:
			'Имя пользователя может состоять только из букв английского алфавита, цифр, _, -',
	})
	username: string
}
