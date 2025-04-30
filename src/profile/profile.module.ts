import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { UserModule } from 'src/user/user.module'
import { PrismaService } from 'src/prisma.service'
import { RedisService } from 'src/redis.service'

@Module({
  imports: [UserModule],
  controllers: [ProfileController],
  providers: [ProfileService, PrismaService, RedisService],
})
export class ProfileModule {}
