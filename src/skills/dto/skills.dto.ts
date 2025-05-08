import { IsNotEmpty, IsString } from 'class-validator'

export class SkillDto {
	@IsString()
	@IsNotEmpty()
	name: string
}