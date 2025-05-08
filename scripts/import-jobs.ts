import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface Job {
	name: string
}

function isJobsArray(data: unknown): data is Job[] {
	return (
		Array.isArray(data) &&
		data.every(
			(item) => typeof item === 'object' && 'name' in item,
		)
	)
}

async function readJobs(): Promise<Job[]> {
	const fileName = 'jobs.json'

	try {
		const filePath = join(process.cwd(), 'data', fileName)

		const fileContent = await readFile(filePath, 'utf-8')

		const data = JSON.parse(fileContent)

		if (!isJobsArray(data)) {
			throw new Error('Invalid jobs data format')
		}

		return data
	} catch (error) {
		console.error(`Error reading or parsing ${fileName}:`, error)
		return []
	}
}

const prisma = new PrismaClient()

async function main() {
	const jobs = await readJobs()

	// await prisma.job.createMany({
	// 	data: jobs.map((job) => ({ name: job.name }))
	// })

	// await prisma.$disconnect()
	// return

	for (const { name } of jobs) {
		try {
			await prisma.job.create({
				data: { name },
			})
			console.log(`✅ Added job: ${name}`)
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes('Unique constraint')
			) {
				console.log(`⚠️ Job already exists: ${name}`)
			} else {
				console.error(`❌ Failed to add job: ${name}`, error)
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
