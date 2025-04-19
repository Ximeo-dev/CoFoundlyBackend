import { UseGuards } from '@nestjs/common'
import { AccountConfirmedGuard } from '../guards/account-confirmed.guard'

export const Confirmed = () => UseGuards(AccountConfirmedGuard)