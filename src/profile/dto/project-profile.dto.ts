import { PartialType } from '@nestjs/mapped-types'
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import {
	ArrayMaxSize,
	IsArray,
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator'
import { Entity } from 'src/entities/types/entity.types'
import { Flatten } from 'src/utils/flatten-transformer'

export class CreateProjectDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	name: string

	@ApiProperty()
	@MinLength(10)
	@MaxLength(256)
	@IsString()
	description: string

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	industry: string

	@ApiProperty()
	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	languages: string[]

	@ApiProperty()
	@IsArray()
	@ArrayMaxSize(50)
	@IsString({ each: true })
	skills: string[]

	@ApiProperty()
	@IsArray()
	@ArrayMaxSize(10)
	@IsString({ each: true })
	jobs: string[]
}

export class UpdateProjectDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string

	@ApiPropertyOptional()
	@IsOptional()
	@MinLength(10)
	@MaxLength(256)
	@IsString()
	description?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	industry?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	languages?: string[]

	@ApiPropertyOptional()
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(50)
	@IsString({ each: true })
	skills?: string[]

	@ApiPropertyOptional()
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(10)
	@IsString({ each: true })
	jobs?: string[]
}

export class ProjectResponseDto {
	@ApiProperty()
	@Expose()
	id: string

	@ApiProperty()
	@Expose()
	name: string

	@ApiProperty()
	@Expose()
	description: string

	@ApiProperty()
	@Expose()
	hasAvatar: boolean

	@ApiProperty()
	@Expose()
	isPublished: boolean

	@ApiProperty()
	@Expose()
	ownerId: string

	@ApiProperty()
	@Expose()
	createdAt: string

	@ApiProperty()
	@Expose()
	@Flatten('projectRequirement')
	industry: Entity

	@ApiProperty({ type: [Entity] })
	@Expose()
	@Flatten('projectRequirement')
	jobs: Entity[]

	@ApiProperty({ type: [Entity] })
	@Expose()
	@Flatten('projectRequirement')
	languages: Entity[]

	@ApiProperty({ type: [Entity] })
	@Expose()
	@Flatten('projectRequirement')
	skills: Entity[]
}

export class ProjectWithoutOwnerResponseDto extends OmitType(
	ProjectResponseDto,
	['ownerId'] as const,
) {}

export class ProjectMember {
	@ApiProperty()
	@Expose()
	id: string

	@ApiProperty()
	@Expose()
	userId: string

	@ApiProperty()
	@Expose()
	projectId: string

	@ApiProperty()
	@Expose()
	roleId: string

	@ApiProperty()
	@Expose()
	joinedAt: Date
}
