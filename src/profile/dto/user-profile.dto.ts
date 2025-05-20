import { PartialType } from '@nestjs/mapped-types'
import { Exclude, Expose, Type } from 'class-transformer'
import {
	ArrayMaxSize,
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
import { Entity } from 'src/entities/types/entity.types'
import { Flatten } from 'src/utils/flatten-transformer'

export class CreateUserProfileDto {
	@IsString()
	@IsNotEmpty()
	name: string

	@IsDate()
	@MaxDate(subYears(new Date(), 14), {
		message: 'Вам должно быть не менее 14 лет',
	})
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

	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	industries: string[]
}

export class UpdateUserProfileDto extends PartialType(CreateUserProfileDto) {}

export class UserProfileResponseDto {
	@Exclude()
	id: number

	@Expose()
	userId: string

	@Expose()
	@Flatten('user')
	username: string

	@Expose()
	@Flatten('user')
	displayUsername: string

	@Expose()
	name: string

	@Expose()
	birthDate: string

	@Expose()
	age: number

	@Expose()
	hasAvatar: boolean

	@Expose()
	bio: string

	@Expose()
	job: Entity

	@Expose()
	languages: Entity[]

	@Expose()
	skills: Entity[]

	@Expose()
	industries: Entity[]

	@Expose()
	portfolio: string[]

	@Expose()
	likes: number
}
