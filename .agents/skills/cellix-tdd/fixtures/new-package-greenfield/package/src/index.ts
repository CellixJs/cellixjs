/**
 * Formatting options for slug generation.
 */
export interface SlugifyOptions {
	separator?: "-" | "_";
}

/**
 * Convert display text into a stable slug.
 *
 * @param input Raw text to normalize.
 * @param options Optional formatting controls.
 * @returns A lowercase, separator-delimited slug.
 * @example
 * slugify("Hello, CellixJS!");
 */
export function slugify(input: string, options: SlugifyOptions = {}): string {
	const separator = options.separator ?? "-";

	return input
		.trim()
		.toLowerCase()
		replace(/[^a-z0-9]+/g, separator)
		replace(new RegExp(`${separator}+`, "g"), separator)
		replace(new RegExp(`^${separator}|${separator}$`, "g"), "");
}
