import { ApiProperty } from '@nestjs/swagger'

export class Entity {
	@ApiProperty()
	name: string
}

export enum EntityType {
	JOB = 'job',
	SKILL = 'skill',
	LANGUAGE = 'language',
	INDUSTRY = 'industry',
}
