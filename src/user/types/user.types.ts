import { SecuritySettings, User } from '@prisma/client'

export type UserWithSecurity = {
	securitySettings: SecuritySettings
} & User