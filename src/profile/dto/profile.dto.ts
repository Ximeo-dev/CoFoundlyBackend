import { Exclude, Expose, Transform } from 'class-transformer'
import {
	ArrayMaxSize,
	ArrayMinSize,
	ArrayNotEmpty,
	IsArray,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsTimeZone,
} from 'class-validator'

export class CreateProfileDto {
	@IsString()
	bio: string

	@IsString()
	job: string

	@IsArray()
	@ArrayNotEmpty()
	@ArrayMinSize(1) // необязательно, указывает минимальное количество элементов
	@ArrayMaxSize(100) // необязательно, указывает максимальное количество элементов
	@Transform(({ value }) => value.map((v: string) => v.toLowerCase()))
	@IsString({ each: true })
	skills: string[]

	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	portfolio: string[]
}

export class UpdateProfileDto {
	@IsOptional()
	@IsString()
	@Expose()
	@IsNotEmpty()
	bio?: string

	@IsOptional()
	@IsString()
	@Expose()
	@IsNotEmpty()
	job?: string

	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@ArrayMinSize(1) // необязательно, указывает минимальное количество элементов
	@ArrayMaxSize(100) // необязательно, указывает максимальное количество элементов
	@Transform(({ value }) =>
		Array.isArray(value) ? value.map((v: string) => v.toLowerCase()) : value,
	)
	@IsString({ each: true })
	@Expose()
	skills?: string[]

	@IsOptional()
	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	@Expose()
	portfolio?: string[]
}

export class UserProfileResponseDto {
	@Exclude()
	id: number

	@Expose()
	userId: string

	@Expose()
	bio: string

	@Expose()
	portfolio: string

	@Expose()
	job: string

	@Expose()
	likes: string

	@Expose()
	user: {
		age: number
		avatarUrl: string | null
		name: string
	}
}
