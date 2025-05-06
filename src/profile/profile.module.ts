import { Module } from '@nestjs/common'
import { UserModule } from 'src/user/user.module'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'

@Module({
	imports: [UserModule],
	controllers: [ProfileController],
	providers: [ProfileService],
	exports: [ProfileService]
})
export class ProfileModule {}
