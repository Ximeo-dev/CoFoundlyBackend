import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class Entity {
	@Expose()
	@ApiProperty()
	name: string
}

export enum EntityType {
	JOB = 'job',
	SKILL = 'skill',
	LANGUAGE = 'language',
	INDUSTRY = 'industry',
}
