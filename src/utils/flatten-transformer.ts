import { Transform } from 'class-transformer'

export function Flatten(property: string) {
	return Transform(
		({ obj, key }) => {
			const nested = obj[property]
			if (!nested || typeof nested !== 'object') return obj[key]

			return nested[key]
		},
		{ toClassOnly: true },
	)
}
