import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { RelationService } from './relation.service'
import {
	CreateProjectDto,
	ProjectResponseDto,
	UpdateProjectDto,
} from './dto/project-profile.dto'
import { instanceToPlain, plainToClass } from 'class-transformer'
import { USER_PROJECTS_LIMIT } from 'src/constants/constants'

@Injectable()
export class ProjectProfileService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly relationService: RelationService,
	) {}

	async getUserProjects(userId: string) {
		try {
			const projects = await this.prisma.project.findMany({
				where: {
					OR: [
						{
							ownerId: userId,
						},
						{
							members: {
								some: {
									userId,
								},
							},
						},
					],
				},
				include: {
					projectRequirement: {
						select: {
							industry: {
								select: { name: true },
							},
							jobs: {
								select: { name: true },
							},
							languages: {
								select: { name: true },
							},
							skills: {
								select: { name: true },
							},
						},
					},
				},
			})

			if (!projects) {
				throw new NotFoundException(`User ${userId} doesn't have projects`)
			}

			return this.prepareToResponse(projects)
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error
			}
			throw new BadRequestException('Failed to retrieve profile')
		}
	}

	async getProjectById(projectId: string) {
		const project = await this.prisma.project.findUnique({
			where: { id: projectId },
			include: {
				projectRequirement: {
					select: {
						industry: {
							select: { name: true },
						},
						jobs: {
							select: { name: true },
						},
						languages: {
							select: { name: true },
						},
						skills: {
							select: { name: true },
						},
					},
				},
			},
		})
		return this.prepareToResponse(project)
	}

	public prepareToResponse(project: any, excludeOwner: boolean = false) {
		const responseData = excludeOwner
			? { ...project, ownerId: undefined }
			: project

		return plainToClass(ProjectResponseDto, responseData, {
			excludeExtraneousValues: true,
		})
	}

	async createProject(userId: string, dto: CreateProjectDto) {
		const existingProjectCount = await this.prisma.project.count({
			where: { ownerId: userId },
		})

		if (existingProjectCount >= USER_PROJECTS_LIMIT) {
			throw new BadRequestException(
				`You cannot create more than ${USER_PROJECTS_LIMIT} projects`,
			)
		}

		const jobsData = await this.relationService.getRelationData(
			dto.jobs,
			'job',
			'jobs',
			'create',
		)
		const skillsData = await this.relationService.getRelationData(
			dto.skills,
			'skill',
			'skills',
			'create',
		)
		const languagesData = await this.relationService.getRelationData(
			dto.languages,
			'language',
			'languages',
			'create',
		)
		const industryData = await this.relationService.getOneToManyRelationData(
			dto.industry,
			'industry',
			'industryId',
			'create',
		)

		try {
			const project = await this.prisma.project.create({
				data: {
					ownerId: userId,
					name: dto.name,
					description: dto.description,
					projectRequirement: {
						create: {
							...jobsData,
							...skillsData,
							...languagesData,
							...industryData,
						},
					},
				},
				include: {
					projectRequirement: {
						select: {
							industry: {
								select: { name: true },
							},
							jobs: {
								select: { name: true },
							},
							languages: {
								select: { name: true },
							},
							skills: {
								select: { name: true },
							},
						},
					},
				},
			})

			return this.prepareToResponse(project)
		} catch (error) {
			if (error.code === 'P2002') {
				throw new BadRequestException('Project with this id already exists')
			}
			throw error
		}
	}

	async updateProject(
		userId: string,
		projectId: string,
		dto: UpdateProjectDto,
	) {
		const project = await this.prisma.project.findUnique({
			where: { id: projectId },
		})

		if (!project) {
			throw new BadRequestException('Project does not exist')
		}

		if (project.ownerId !== userId)
			throw new ForbiddenException('You are not owner of this project')

		const baseData = instanceToPlain(dto, {
			exposeUnsetFields: false,
		}) as Record<string, any>

		const jobsUpdate = await this.relationService.getRelationData(
			baseData['jobs'],
			'job',
			'jobs',
			'update',
		)
		const skillsUpdate = await this.relationService.getRelationData(
			baseData['skills'],
			'skill',
			'skills',
			'update',
		)
		const languagesUpdate = await this.relationService.getRelationData(
			baseData['languages'],
			'language',
			'languages',
			'update',
		)
		const industryUpdate = await this.relationService.getOneToManyRelationData(
			baseData['industry'],
			'industry',
			'industryId',
			'update',
		)

		delete baseData.job
		delete baseData.skills
		delete baseData.languages
		delete baseData.industries

		try {
			const updatedProject = await this.prisma.project.update({
				where: { id: projectId },
				data: {
					...baseData,

					projectRequirement: {
						update: {
							...jobsUpdate,
							...skillsUpdate,
							...languagesUpdate,
							...industryUpdate,
						},
					},
				},
				include: {
					projectRequirement: {
						select: {
							industry: {
								select: { name: true },
							},
							jobs: {
								select: { name: true },
							},
							languages: {
								select: { name: true },
							},
							skills: {
								select: { name: true },
							},
						},
					},
				},
			})

			return this.prepareToResponse(updatedProject)
		} catch (error) {
			if (error.code === 'P2025') {
				throw new BadRequestException('Project not found')
			}
			throw error
		}
	}

	async deleteProject(userId: string, projectId: string) {
		const project = await this.prisma.project.findUnique({
			where: { id: projectId },
		})

		if (!project) {
			throw new BadRequestException('Project does not exist')
		}

		if (project.ownerId !== userId)
			throw new ForbiddenException('You are not owner of this project')

		await this.prisma.project.delete({
			where: { id: projectId },
		})
		return { projectId, deleted: true }
	}
}
