import { Injectable, NotFoundException } from '@nestjs/common'
import { Skill } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { UserProfileExtended } from 'src/profile/types/profile.types'

@Injectable()
export class SwipeService {
	constructor(private prisma: PrismaService) {}
}
