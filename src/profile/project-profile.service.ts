import {
	BadRequestException,
	ForbiddenException,
	forwardRef,
	Inject,
	Injectable,
	Logger,
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
import { ImagesService } from 'src/images/images.service'
import { AvatarType } from 'src/images/types/image.types'

@Injectable()
export class ProjectProfileService {
	private logger: Logger = new Logger(ProjectProfileService.name)

	constructor(
		private readonly prisma: PrismaService,
		private readonly relationService: RelationService,
		@Inject(forwardRef(() => ImagesService))
		private readonly imagesService: ImagesService,
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

			return this.prepareToResponse(projects)
		} catch (error) {
			this.logger.error('Get user projects error', error)
			throw new BadRequestException('Failed to retrieve projects')
		}
	}

	async getProjectById(projectId: string) {
		const project = await this.prisma.project.findUnique({
			where: {
				id: projectId,
				isPublished: true,
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
		return this.prepareToResponse(project, true)
	}

	public prepareToResponse(project: any, excludeOwner: boolean = false) {
		const responseData = excludeOwner
			? { ...project, ownerId: undefined }
			: project

		return plainToClass(ProjectResponseDto, responseData, {
			excludeExtraneousValues: true,
		})
	}

	async getProjectMembers(projectId: string) {
		return this.prisma.projectMember.findMany({
			where: {
				projectId,
			},
		})
	}

	async addMemberToProject(projectId: string, userId: string) {
		const userProfile = await this.prisma.userProfile.findUnique({
			where: { userId },
		})

		if (!userProfile)
			throw new BadRequestException('User must have profile for join project')
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
		await this.imagesService.deleteAvatar(projectId, AvatarType.PROJECT)
		await this.setHasAvatar(projectId, false)
		return { projectId, deleted: true }
	}

	async setHasAvatar(projectId: string, status: boolean) {
		try {
			await this.prisma.project.update({
				where: { id: projectId },
				data: {
					hasAvatar: status,
				},
			})
			return { projectId, status }
		} catch (error) {
			if (error.code === 'P2025') {
				throw new NotFoundException(
					`Project with id ${projectId} does not exist`,
				)
			}
			throw error
		}
	}
}
