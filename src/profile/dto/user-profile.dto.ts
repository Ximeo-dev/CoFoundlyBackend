import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger'
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
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	name: string

	@ApiProperty()
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

	@ApiProperty()
	@MinLength(10)
	@MaxLength(256)
	@IsString()
	bio: string

	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	job: string

	@ApiProperty()
	@IsArray()
	@ArrayMaxSize(20)
	@IsString({ each: true })
	skills: string[]

	@ApiProperty()
	@IsArray()
	@ArrayMaxSize(5)
	@IsUrl({ protocols: ['https'] }, { each: true })
	portfolio: string[]

	@ApiProperty()
	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	languages: string[]

	@ApiProperty()
	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	industries: string[]
}

export class UpdateUserProfileDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsDate()
	@MaxDate(subYears(new Date(), 14), {
		message: 'Вам должно быть не менее 14 лет',
	})
	@Type(() => Date)
	birthDate?: string

	// @IsString()
	// @IsNotEmpty()
	// country: string

	// @IsString()
	// @IsNotEmpty()
	// city: string

	@ApiPropertyOptional()
	@IsOptional()
	@MinLength(10)
	@MaxLength(256)
	@IsString()
	bio?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsNotEmpty()
	@IsString()
	job?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(20)
	@IsString({ each: true })
	skills?: string[]

	@ApiPropertyOptional()
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(5)
	@IsUrl({ protocols: ['https'] }, { each: true })
	portfolio?: string[]

	@ApiPropertyOptional()
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	languages?: string[]

	@ApiPropertyOptional()
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	industries?: string[]
}

export class UserProfileResponseDto {
	@Exclude()
	id: number

	@ApiProperty()
	@Expose()
	userId: string

	@ApiProperty()
	@Expose()
	@Flatten('user')
	username: string

	@ApiProperty()
	@Expose()
	@Flatten('user')
	displayUsername: string

	@ApiProperty()
	@Expose()
	name: string

	@ApiProperty()
	@Expose()
	birthDate: string

	@ApiProperty()
	@Expose()
	age: number

	@ApiProperty()
	@Expose()
	hasAvatar: boolean

	@ApiProperty()
	@Expose()
	bio: string

	@ApiProperty()
	@Expose()
	job: Entity

	@ApiProperty({ type: [Entity] })
	@Expose()
	languages: Entity[]

	@ApiProperty({ type: [Entity] })
	@Expose()
	skills: Entity[]

	@ApiProperty({ type: [Entity] })
	@Expose()
	industries: Entity[]

	@ApiProperty()
	@Expose()
	portfolio: string[]

	@ApiProperty()
	@Expose()
	likes: number
}

export class UserProfileWithoutBirthDateResponseDto extends OmitType(
	UserProfileResponseDto,
	['birthDate'] as const,
) {}
