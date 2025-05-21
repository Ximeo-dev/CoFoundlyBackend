import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

export class EntityDto {
	@IsString()
	@IsNotEmpty()
	name: string
}

export class AutocompleteQueryParamsDto {
	@ApiProperty({ default: 1, minimum: 1 })
	@IsInt()
	@Min(1)
	@IsOptional()
	@Type(() => Number)
	limit: number = 10

	@ApiProperty({ default: '' })
	@IsString()
	@IsOptional()
	query: string = ''
}