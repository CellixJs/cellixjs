export function ensurePortInUrl(baseUrl: string, port: number): string {
	try {
		const parsed = new URL(baseUrl);
		if (!parsed.port && port !== 443) {
			parsed.port = String(port);
			return parsed.toString();
		}
		return baseUrl;
	} catch {
		// leave baseUrl as-is on parse errors
		return baseUrl;
	}
}
