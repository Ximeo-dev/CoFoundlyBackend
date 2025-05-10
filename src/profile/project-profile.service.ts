import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { RelationService } from './relation.service'

@Injectable()
export class ProjectProfileService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly relationService: RelationService,
	) {}
}
