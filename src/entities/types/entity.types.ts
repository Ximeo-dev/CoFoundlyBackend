import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class Entity {
	@Expose()
	@ApiProperty()
	name: string
}

export const EntityType = {
	JOB: 'job',
	SKILL: 'skill',
	LANGUAGE: 'language',
	INDUSTRY: 'industry',
} as const

export type EntityType = (typeof EntityType)[keyof typeof EntityType]
