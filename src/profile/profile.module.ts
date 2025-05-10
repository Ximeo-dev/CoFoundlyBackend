import { Module } from '@nestjs/common'
import { UserModule } from 'src/user/user.module'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { RelationService } from './relation.service'

@Module({
	imports: [UserModule],
	controllers: [ProfileController],
	providers: [ProfileService, RelationService],
	exports: [ProfileService]
})
export class ProfileModule {}
