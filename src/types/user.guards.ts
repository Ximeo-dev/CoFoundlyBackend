import { UserWithSecurity } from './user.types'

export function hasSecuritySettings(user: any): user is UserWithSecurity {
	return !!user && !!user.securitySettings
}