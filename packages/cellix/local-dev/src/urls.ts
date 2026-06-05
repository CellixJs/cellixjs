export const PORTLESS_PORT = 1355;

/**
 * Returns the hostname portion of a URL string, or `null` when the value is not
 * a valid URL.
 */
export function hostnameFromUrl(url: string): string | null {
	try {
		return new URL(url).hostname;
	} catch {
		return null;
	}
}

/**
 * Applies a worktree suffix to a `.localhost` hostname.
 */
export function applyWorktreeSuffix(hostname: string, worktreeName: string | undefined): string {
	if (!worktreeName) {
		return hostname;
	}

	return hostname.replace('.localhost', `.${worktreeName}.localhost`);
}

/**
 * Builds a portless-proxied HTTPS URL for a hostname and optional path.
 */
export function buildPortlessUrl(hostname: string, relativePath = ''): string {
	return `https://${hostname}:${PORTLESS_PORT}${relativePath}`;
}

/**
 * Replaces the port component of a URL and returns the updated string.
 */
export function replaceUrlPort(url: string, port: number | string): string {
	const parsedUrl = new URL(url);
	parsedUrl.port = String(port);
	return parsedUrl.toString();
}
