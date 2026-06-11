export const PORTLESS_PORT = 1355;

const LOCALHOST_SUFFIX_PATTERN = /(^|\.)localhost$/;

/**
 * Converts a worktree name into a DNS-label-safe hostname segment.
 *
 * The returned value is lower-case, replaces non-alphanumeric separators with
 * `-`, trims leading/trailing dashes, and is capped to one DNS label. When the
 * input cannot produce a valid label, `undefined` is returned so callers can
 * leave the base hostname unchanged.
 *
 * @param worktreeName - Raw worktree identifier, often copied from a branch or
 * directory name.
 * @returns A hostname-safe label, or `undefined` when no usable label exists.
 *
 * @example
 * ```ts
 * sanitizeWorktreeHostnameLabel('jason/feature one');
 * // 'jason-feature-one'
 * ```
 */
export function sanitizeWorktreeHostnameLabel(worktreeName: string | undefined): string | undefined {
	const label = worktreeName
		?.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 63)
		.replace(/-+$/g, '');

	return label || undefined;
}

/**
 * Returns the hostname portion of a URL string, or `null` when the value is not
 * a valid URL.
 *
 * @param url - Absolute URL string to inspect.
 * @returns The parsed hostname, or `null` for invalid URL strings.
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
 *
 * The worktree segment is sanitized before use so raw branch-style names such
 * as `jason/my-feature` do not create invalid local hostnames. Hostnames that
 * do not end in `.localhost` are returned unchanged.
 *
 * @param hostname - Base local hostname, for example `ownercommunity.localhost`.
 * @param worktreeName - Optional raw worktree identifier.
 * @returns The hostname with a worktree label inserted before `.localhost`.
 *
 * @example
 * ```ts
 * applyWorktreeSuffix('ownercommunity.localhost', 'jason/my-feature');
 * // 'ownercommunity.jason-my-feature.localhost'
 * ```
 */
export function applyWorktreeSuffix(hostname: string, worktreeName: string | undefined): string {
	const label = sanitizeWorktreeHostnameLabel(worktreeName);
	if (!label || !LOCALHOST_SUFFIX_PATTERN.test(hostname)) {
		return hostname;
	}

	if (hostname === 'localhost') {
		return `${label}.localhost`;
	}

	const localhostIndex = hostname.lastIndexOf('.localhost');
	const labelsBeforeLocalhost = hostname.slice(0, localhostIndex).split('.');
	if (labelsBeforeLocalhost.at(-1) === label) {
		return hostname;
	}

	return hostname.replace(LOCALHOST_SUFFIX_PATTERN, `.${label}.localhost`);
}

/**
 * Builds a portless-proxied HTTPS URL for a hostname and optional path.
 *
 * @param hostname - Public local hostname managed by portless.
 * @param relativePath - Optional path to append. Include the leading slash when
 * a path is needed.
 * @returns An HTTPS URL using Cellix's local portless port.
 */
export function buildPortlessUrl(hostname: string, relativePath = ''): string {
	return `https://${hostname}:${PORTLESS_PORT}${relativePath}`;
}

/**
 * Replaces the port component of a URL and returns the updated string.
 *
 * @param url - Absolute URL string to update.
 * @param port - Replacement port number or numeric string.
 * @returns The updated URL string.
 */
export function replaceUrlPort(url: string, port: number | string): string {
	const parsedUrl = new URL(url);
	parsedUrl.port = String(port);
	return parsedUrl.toString();
}
