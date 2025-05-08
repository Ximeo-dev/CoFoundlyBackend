import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface Entity {
	name: string
}

function isEntitiesArray(data: unknown): data is Entity[] {
	return (
		Array.isArray(data) &&
		data.every((item) => typeof item === 'object' && 'name' in item)
	)
}

async function readEntities(): Promise<Entity[]> {
	const fileName = 'industries.json'

	try {
		const filePath = join(process.cwd(), 'data', fileName)

		const fileContent = await readFile(filePath, 'utf-8')

		const data = JSON.parse(fileContent)

		if (!isEntitiesArray(data)) {
			throw new Error('Invalid entity data format')
		}

		return data
	} catch (error) {
		console.error(`Error reading or parsing ${fileName}:`, error)
		return []
	}
}

const prisma = new PrismaClient()

async function main() {
	const industries = await readEntities()

	// await prisma.job.createMany({
	// 	data: jobs.map((job) => ({ name: job.name }))
	// })

	// await prisma.$disconnect()
	// return

	for (const { name } of industries) {
		try {
			await prisma.industry.create({
				data: { name },
			})
			console.log(`✅ Added industry: ${name}`)
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes('Unique constraint')
			) {
				console.log(`⚠️ industry already exists: ${name}`)
			} else {
				console.error(`❌ Failed to add industry: ${name}`, error)
			}
		}
	}

	await prisma.$disconnect()
}

main().catch((e) => {
	console.error(e)
	prisma.$disconnect()
	process.exit(1)
})
