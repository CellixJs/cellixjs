// biome-ignore lint/complexity/useLiteralKeys: ProcessEnv uses an index signature in this repo's TypeScript config.
const debugFlag = process.env['MOCK_OAUTH2_DEBUG'];
const debugEnabled = debugFlag === '1' || debugFlag === 'true';

/**
 * Emits mock OAuth2 debug output when `MOCK_OAUTH2_DEBUG` is enabled.
 *
 * @param message - Human-readable debug message.
 * @param data - Optional structured fields to log alongside the message.
 *
 * @example
 * ```ts
 * debugLog('[server-oauth2-mock] addUser persisted', { portal: 'community', user: 'alice' });
 * ```
 */
export function debugLog(message: string, data?: Record<string, unknown>): void {
	if (debugEnabled) {
		if (data !== undefined) {
			console.debug(message, data);
		} else {
			console.debug(message);
		}
	}
}
