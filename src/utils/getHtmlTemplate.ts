import { readFile } from 'fs/promises'
import { join } from 'path'

export async function getHtmlTemplate(path: string) {
	try {
		const filePath = join(process.cwd(), path)
		return await readFile(filePath, 'utf-8')
	} catch (error) {
		console.error('Ошибка чтения шаблона:', error)
	}
}
