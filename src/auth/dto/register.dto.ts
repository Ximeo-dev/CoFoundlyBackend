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

	@IsString()
	@IsNotEmpty()
	name: string

	@MinLength(8, {
		message: 'Пароль должен состоять минимум из 8 символов',
	})
	@IsString()
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