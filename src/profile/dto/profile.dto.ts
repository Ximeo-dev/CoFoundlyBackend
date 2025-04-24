import { Transform } from 'class-transformer'
import {
	ArrayMaxSize,
	ArrayMinSize,
	ArrayNotEmpty,
	IsArray,
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

	@IsTimeZone()
	timezone: string
}
