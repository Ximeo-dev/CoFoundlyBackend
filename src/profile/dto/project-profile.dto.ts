import { PartialType } from '@nestjs/mapped-types'
import { Exclude, Expose, Type } from 'class-transformer'
import {
	IsString,
	IsNotEmpty,
	IsDate,
	MaxDate,
	MinLength,
	MaxLength,
	IsArray,
	ArrayMaxSize,
	IsUrl,
} from 'class-validator'
import { Entity } from 'src/entities/entities.service'
import { Flatten } from 'src/utils/flatten-transformer'

export class CreateProjectDto {
	@IsString()
	@IsNotEmpty()
	name: string

	@MinLength(10)
	@MaxLength(256)
	@IsString()
	description: string

	@IsString()
	@IsNotEmpty()
	industry: string

	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	languages: string[]

	@IsArray()
	@ArrayMaxSize(50)
	@IsString({ each: true })
	skills: string[]

	@IsArray()
	@ArrayMaxSize(10)
	@IsString({ each: true })
	jobs: string[]
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class ProjectResponseDto {
	@Expose()
	id: string

	@Expose()
	name: string

	@Expose()
	description: string

	@Expose()
	hasAvatar: boolean

	@Expose()
	ownerId: string

	@Expose()
	createdAt: string

	@Expose()
	@Flatten('projectRequirement')
	industry: Entity

	@Expose()
	@Flatten('projectRequirement')
	jobs: Entity[]

	@Expose()
	@Flatten('projectRequirement')
	languages: Entity[]

	@Expose()
	@Flatten('projectRequirement')
	skills: Entity[]
}
