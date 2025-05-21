import { ApiProperty } from '@nestjs/swagger'
import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator'
import { UserResponseDto } from 'src/user/dto/user.dto'

export class LoginDto {
	@ApiProperty({ example: 'user@example.com' })
	@IsEmail()
	@IsNotEmpty()
	email: string

	@ApiProperty({ example: 'password123' })
	@MinLength(8, {
		message: 'Пароль должен состоять минимум из 8 символов',
	})
	@MaxLength(128, {
		message: 'Длина пароля не должна превышать 128 символов',
	})
	@IsString()
	password: string
}

export class LoginResponseDto {
	@ApiProperty()
	user: UserResponseDto
	@ApiProperty({ example: 'token' })
	accessToken: string
}
