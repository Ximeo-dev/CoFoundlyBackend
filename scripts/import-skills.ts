import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface Skill {
	id: string
	name: string
}

function isSkillArray(data: unknown): data is Skill[] {
	return (
		Array.isArray(data) &&
		data.every(
			(item) => typeof item === 'object' && 'id' in item && 'name' in item,
		)
	)
}

async function readSkills(): Promise<Skill[]> {
	try {
		const filePath = join(process.cwd(), 'data', 'skills.json')

		const fileContent = await readFile(filePath, 'utf-8')

		const data = JSON.parse(fileContent)

		if (!isSkillArray(data)) {
			throw new Error('Invalid skills data format')
		}

		return data
	} catch (error) {
		console.error('Error reading or parsing skills.json:', error)
		return []
	}
}

async function fetchSkills() {
	const response = await fetch(
		'https://raw.githubusercontent.com/devicons/devicon/refs/heads/master/devicon.json',
	)
	const data = await response.json()

	const skills = data.map((icon: any) => {
		return { id: icon.name }
	})

	return skills
}

const prisma = new PrismaClient()

async function main() {
	const skills = await readSkills()

	// await prisma.skill.createMany({
	// 	data: skills.map((skill) => ({ name: skill.name }))
	// })

	// await prisma.$disconnect()
	// return

	for (const { name, id } of skills) {
		try {
			await prisma.skill.create({
				data: { name },
			})
			console.log(`✅ Added skill: ${name}`)
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes('Unique constraint')
			) {
				console.log(`⚠️ Skill already exists: ${name}`)
			} else {
				console.error(`❌ Failed to add skill: ${name}`, error)
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
