/** Utility helpers for server-oauth2-mock-seedwork. */

/**
 * Regular expression used to validate named portal registrations.
 * Matches only letters, digits, underscores, and hyphens.
 *
 * @example
 * ```ts
 * SAFE_NAME_RE.test('portal_admin-1'); // true
 * SAFE_NAME_RE.test('portal/admin'); // false
 * ```
 */
export const SAFE_NAME_RE = /^[a-zA-Z0-9_-]+$/;

export const AUTH_CODE_PREFIX = 'mock-auth-code-';

/**
 * Normalizes a URL for redirect-URI comparisons by removing a trailing slash from the
 * path and sorting query parameters.
 *
 * @param value - The candidate URL string.
 * @returns The normalized URL string, or the original value when parsing fails.
 *
 * @example
 * ```ts
 * normalizeUrl('https://example.com/callback/?b=2&a=1');
 * // => 'https://example.com/callback?a=1&b=2'
 * ```
 */
export const normalizeUrl = (value: string) => {
	try {
		const url = new URL(value);
		const pathname = url.pathname.replace(/\/$/, '') || '/';
		const params = new URLSearchParams(url.search);
		params.sort();
		const search = params.toString() ? `?${params.toString()}` : '';
		return `${url.origin}${pathname}${search}`;
	} catch {
		return value;
	}
};

/**
 * Extracts the origin portion of a URL so CORS checks can compare normalized origins.
 *
 * @param value - The candidate URL string.
 * @returns The normalized origin, or the original value when parsing fails.
 *
 * @example
 * ```ts
 * normalizeOrigin('https://example.com/path?x=1');
 * // => 'https://example.com'
 * ```
 */
export const normalizeOrigin = (value: string) => {
	try {
		const url = new URL(value);
		return `${url.protocol}//${url.host}`;
	} catch {
		return value;
	}
};

/**
 * Removes a trailing slash from a configured issuer or base URL.
 *
 * @param url - The configured base URL.
 * @returns The base URL without a trailing slash.
 *
 * @example
 * ```ts
 * normalizeBaseUrl('http://localhost:3000/');
 * // => 'http://localhost:3000'
 * ```
 */
export function normalizeBaseUrl(url: string): string {
	return url.replace(/\/$/, '');
}

/**
 * Ensures a non-standard port is present in the given URL.
 *
 * If the URL already carries an explicit port, or `port` is `443` (the HTTPS default),
 * the original `baseUrl` string is returned unchanged. On URL parse failure the original
 * value is returned as-is.
 *
 * @param baseUrl - The URL to inspect and potentially modify.
 * @param port - The port number to inject when the URL has no explicit port.
 * @returns The URL with the port set, or `baseUrl` unchanged when the port is already
 *   present, the port equals `443`, or the URL cannot be parsed.
 *
 * @example
 * ```ts
 * ensurePortInUrl('https://mock-auth.example.localhost', 1355);
 * // => 'https://mock-auth.example.localhost:1355/'
 *
 * ensurePortInUrl('https://mock-auth.example.localhost:8080', 1355);
 * // => 'https://mock-auth.example.localhost:8080' (port already set — unchanged)
 *
 * ensurePortInUrl('https://secure.example.localhost', 443);
 * // => 'https://secure.example.localhost' (443 is the HTTPS default — unchanged)
 * ```
 */
export function ensurePortInUrl(baseUrl: string, port: number): string {
	try {
		const parsed = new URL(baseUrl);
		if (!parsed.port && port !== 443) {
			parsed.port = String(port);
			return parsed.toString();
		}
		return baseUrl;
	} catch {
		return baseUrl;
	}
}
