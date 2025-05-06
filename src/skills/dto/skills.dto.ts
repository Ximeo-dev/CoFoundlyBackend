import { IsNotEmpty, IsString } from 'class-validator'

export class SkillDto {
	@IsString()
	@IsNotEmpty()
	id: string

	@IsString()
	@IsNotEmpty()
	name: string
}