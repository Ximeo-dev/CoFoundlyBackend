import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

export class EntityDto {
	@IsString()
	@IsNotEmpty()
	name: string
}

export class AutocompleteQueryParamsDto {
	@IsInt()
	@Min(1)
	@IsOptional()
	@Type(() => Number)
	limit: number = 10

	@IsString()
	@IsOptional()
	query: string = ''
}
