import {
	IsEmail,
	IsNotEmpty,
	MinLength,
	IsString,
	Matches,
} from 'class-validator'

export class ResetPasswordRequestDto {
	@IsEmail()
	@IsNotEmpty()
	email: string
}

export class ResetPasswordConfirmDto {
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
