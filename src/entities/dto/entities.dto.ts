import { IsNotEmpty, IsString } from 'class-validator'

export class EntityDto {
	@IsString()
	@IsNotEmpty()
	name: string
}
