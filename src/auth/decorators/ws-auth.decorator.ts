import { UseGuards } from '@nestjs/common'
import { WSAuthGuard } from '../guards/ws-auth.guard'

export const WSAuth = () => UseGuards(WSAuthGuard)
