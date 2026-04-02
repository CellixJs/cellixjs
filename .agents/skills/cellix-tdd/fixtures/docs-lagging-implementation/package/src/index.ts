/**
 * Read a required environment variable.
 *
 * @param name Environment variable name.
 * @returns The configured string value.
 * @throws {Error} When the variable is missing.
 */
export function readRequiredEnv(name: string): string {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing env var: ${name}`);
	}

	return value;
}

export function readOptionalEnv(name: string, defaultValue = ""): string {
	return process.env[name] ?? defaultValue;
}
