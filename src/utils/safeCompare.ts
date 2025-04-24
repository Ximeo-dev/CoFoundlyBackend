import { timingSafeEqual } from 'crypto'

export function safeCompare(a?: string | null, b?: string | null): boolean {
	if (typeof a !== 'string' || typeof b !== 'string') return false
	if (a.length !== b.length) return false

	try {
		return timingSafeEqual(Buffer.from(a), Buffer.from(b))
	} catch {
		return false
	}
}
