/**
 * Parse a query parameter as a boolean flag.
 *
 * @param input Raw query-string value.
 * @returns `true` or `false` based on the accepted token set.
 * @throws {TypeError} When the value is non-empty and not a supported boolean token.
 * @example
 * parseBooleanFlag("yes");
 */
export function parseBooleanFlag(input: string | null | undefined): boolean {
	if (input == null || input === '') {
		return false;
	}

	const normalized = input.trim().toLowerCase();

	if (['true', '1', 'yes'].includes(normalized)) {
		return true;
	}

	if (['false', '0', 'no'].includes(normalized)) {
		return false;
	}

	throw new TypeError(`Unsupported boolean flag: ${input}`);
}

/**
 * Split a comma-separated query parameter into trimmed values.
 *
 * @param input Raw query-string value.
 * @returns A list of non-empty string items.
 * @example
 * parseStringList("alpha, beta");
 */
export function parseStringList(input: string | null | undefined): string[] {
	if (input == null || input === '') {
		return [];
	}

	return input
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}
