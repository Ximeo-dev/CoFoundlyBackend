import { forwardRef, Module } from '@nestjs/common'
import { UserModule } from 'src/user/user.module'
import { UserProfileController } from './user-profile.controller'
import { RelationService } from './relation.service'
import { UserProfileService } from './user-profile.service'
import { ProjectProfileController } from './project-profile.controller'
import { ProjectProfileService } from './project-profile.service'
import { SecurityModule } from 'src/security/security.module'
import { ImagesModule } from 'src/images/images.module'

@Module({
	imports: [UserModule, SecurityModule, ImagesModule],
	controllers: [UserProfileController, ProjectProfileController],
	providers: [UserProfileService, ProjectProfileService, RelationService],
	exports: [UserProfileService, ProjectProfileService],
})
export class ProfileModule {}
