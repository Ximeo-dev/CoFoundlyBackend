export function calculateAge(birthDate: Date) {
	const birth = new Date(birthDate)
	const today = new Date()

	let age = today.getFullYear() - birth.getFullYear()
	const m = today.getMonth() - birth.getMonth()
	if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
		age--
	}

	return age
}
