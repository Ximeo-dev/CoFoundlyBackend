import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

type OneToManyType = 'job' | 'projectRole'
type ManyToManyType = 'skill' | 'language' | 'industry'

@Injectable()
export class RelationService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Обработка связанных сущностей (many-to-many: ManyToManyType)
	 * @param data - Данные для обновления
	 * @param modelName - Имя модели Prisma (ManyToManyType)
	 * @param operation - Операция (create или update)
	 * @returns Данные для Prisma (connect или set)
	 */
	public async getRelationData(
		data: any,
		modelName: ManyToManyType,
		fieldName: string,
		operation: 'create' | 'update',
	) {
		if (data !== undefined) {
			if (data.length > 0) {
				const existingRecords = await this.prisma[modelName as string].findMany(
					{
						where: {
							name: {
								in: data,
							},
						},
						select: { id: true },
					},
				)

				if (existingRecords.length !== data.length) {
					throw new BadRequestException(`One or more ${modelName} do not exist`)
				}

				const relationType = operation === 'create' ? 'connect' : 'set'
				return {
					[fieldName]: {
						[relationType]: existingRecords.map((record) => ({
							id: record.id,
						})),
					},
				}
			} else if (operation === 'update' && data.length === 0) {
				return {
					[fieldName]: {
						set: [],
					},
				}
			}
		}
		return {}
	}

	/**
	 * Обработка связанных сущностей (one-to-many: OneToManyType)
	 * @param data - Данные для обновления
	 * @param modelName - Имя модели Prisma (OneToManyType)
	 * @param operation - Операция (create или update)
	 * @returns Данные для Prisma (connect или disconnect)
	 */
	public async getOneToManyRelationData(
		data: any,
		modelName: OneToManyType,
		fieldName: string,
		operation: 'create' | 'update',
	) {
		if (data !== undefined) {
			// Если предоставлено значение (не null и не пустая строка)
			if (data && typeof data === 'string' && data.trim() !== '') {
				const existingRecord = await this.prisma[
					modelName as string
				].findUnique({
					where: {
						name: data,
					},
					select: { id: true },
				})

				if (!existingRecord) {
					throw new BadRequestException(`${modelName} ${data} does not exist`)
				}

				if (operation === 'create') {
					return {
						[fieldName]: existingRecord.id,
					}
				}

				return {
					[fieldName]: {
						connect: { id: existingRecord.id },
					},
				}
			}
			// Для update: если null или пустая строка, отключаем связь
			else if (operation === 'update') {
				console.log('disconnect')
				return {
					[fieldName]: {
						disconnect: true,
					},
				}
			}
		}
		return {}
	}
}
