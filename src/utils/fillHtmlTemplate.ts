export function fillHtmlTemplate(template: string, variables: object) {
	return template.replace(/{{(.*?)}}/g, (_, key) => variables[key.trim()] || '')
}
