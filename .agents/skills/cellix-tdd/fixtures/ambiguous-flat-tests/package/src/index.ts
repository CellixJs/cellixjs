/**
 * Normalize an optional hostname input into a concrete host string.
 *
 * @param input Raw host value supplied by configuration.
 * @returns A trimmed hostname, or `localhost` when the input is empty.
 * @example
 * parseHost(process.env.HOST);
 */
export function parseHost(input: string | null | undefined): string {
	const normalized = input?.trim();

	return normalized && normalized.length > 0 ? normalized : "localhost";
}

/**
 * Normalize an optional port input into a validated TCP port number.
 *
 * @param input Raw port value supplied by configuration.
 * @returns A numeric TCP port in the inclusive range `1..65535`.
 * @throws {RangeError} When the input is not a valid TCP port.
 * @example
 * parsePort(process.env.PORT);
 */
export function parsePort(input: string | null | undefined): number {
	const normalized = input?.trim() ?? "";
	const port = Number(normalized);

	if (!Number.isInteger(port) || port < 1 || port > 65_535) {
		throw new RangeError(`Invalid TCP port: ${input}`);
	}

	return port;
}
