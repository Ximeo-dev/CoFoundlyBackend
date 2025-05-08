import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common'

@Injectable()
export class EnumValidationPipe<T> implements PipeTransform {
	constructor(private readonly enumType: Record<string, any>) {}

	transform(value: any): T[keyof T] {
		const enumValues = Object.values(this.enumType)

		if (!enumValues.includes(value)) {
			throw new BadRequestException({
				message: `Invalid value '${value}'. Allowed values are: ${enumValues.join(', ')}`,
			})
		}

		return value
	}
}
