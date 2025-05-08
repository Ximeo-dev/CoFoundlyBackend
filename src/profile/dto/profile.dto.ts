import { Exclude, Expose, Transform, Type } from 'class-transformer'
import {
	ArrayMaxSize,
	ArrayMinSize,
	ArrayNotEmpty,
	IsArray,
	IsDate,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUrl,
	MaxDate,
	MaxLength,
	MinLength,
} from 'class-validator'
import { subYears } from 'date-fns'

export class CreateProfileDto {
	@IsString()
	@IsNotEmpty()
	name: string

	@IsDate()
	@MaxDate(subYears(new Date(), 14), { message: 'Вам должно быть не менее 14 лет' })
	@Type(() => Date)
	birthDate: string

	// @IsString()
	// @IsNotEmpty()
	// country: string

	// @IsString()
	// @IsNotEmpty()
	// city: string

	@MinLength(10)
	@MaxLength(256)
	@IsString()
	bio: string

	@IsNotEmpty()
	@IsString()
	job: string

	@IsArray()
	@ArrayMaxSize(20)
	@IsString({ each: true })
	skills: string[]

	@IsArray()
	@ArrayMaxSize(5)
	@IsUrl({ protocols: ['https'] }, { each: true })
	portfolio: string[]

	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	languages: string[]
}

export class UpdateProfileDto {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string

	// @IsOptional()
	// @IsDate()
	// @MaxDate(subYears(new Date(), 14), { message: 'Вам должно быть не менее 14 лет' })
	// @Type(() => Date)
	// birthDate?: string

	@IsOptional()
	@IsString()
	@Expose()
	@MinLength(10)
	@MaxLength(256)
	bio?: string

	@IsOptional()
	@IsString()
	@Expose()
	@IsNotEmpty()
	job?: string

	@IsOptional()
	@IsArray()
	@ArrayMaxSize(20)
	@IsString({ each: true })
	@Expose()
	skills?: string[]

	@IsOptional()
	@IsArray()
	@ArrayMaxSize(5)
	@IsUrl({ protocols: ['https'] }, { each: true })
	@Expose()
	portfolio?: string[]

	@IsOptional()
	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	languages?: string[]
}

export class UserProfileResponseDto {
	@Exclude()
	id: number

	@Expose()
	userId: string

	@Expose()
	name: string

	@Expose()
	birthDate: string

	@Expose()
	age: number

	@Expose()
	avatarUrl: string

	@Expose()
	bio: string

	@Expose()
	job: string

	@Expose()
	portfolio: string[]

	@Expose()
	languages: string[]

	@Expose()
	skills: string[]

	@Expose()
	likes: number
}
