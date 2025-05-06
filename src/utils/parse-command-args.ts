export function parseCommandArgs(text: string | undefined): string[] {
	if (text) return text.trim().split(/\s+/).slice(1)
	return []
}
