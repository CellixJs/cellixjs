/**
 * Normalize a header name to its canonical lowercase form.
 *
 * @param value Header name supplied by a caller.
 * @returns The lowercase header name.
 */
export function normalizeHeaderName(value: string): string {
	return value.trim().toLowerCase();
}
