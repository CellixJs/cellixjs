export function buildRouteKey(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, '-');
}
