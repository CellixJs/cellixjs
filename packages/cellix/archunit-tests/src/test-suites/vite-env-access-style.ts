import { describe, expect, it } from 'vitest';
import { checkViteEnvAccessStyle, type ViteEnvAccessStyleConfig } from '../checks/vite-env-access-style.js';

export interface ViteEnvAccessStyleTestsConfig extends ViteEnvAccessStyleConfig {
	/**
	 * Label included in the Vitest describe title so package-level reports stay distinguishable.
	 */
	testName?: string;
}

/**
 * Registers the standard Vitest suite that enforces property access on `import.meta.env`.
 *
 * Call this from a consumer `*.test.ts` file. The suite fails when source under `scanPaths`
 * destructures `import.meta.env` or reads it with brackets, both of which bypass
 * `noPropertyAccessFromIndexSignature`.
 *
 * @param config - Scan roots, optional skip list, and suite label
 *
 * @example
 * ```ts
 * import { describeViteEnvAccessStyleTests } from '@cellix/archunit-tests/frontend';
 *
 * describeViteEnvAccessStyleTests({
 * 	scanPaths: ['./src'],
 * 	testName: 'UI Community',
 * });
 * ```
 */
export function describeViteEnvAccessStyleTests(config: ViteEnvAccessStyleTestsConfig): void {
	describe(`Vite env access style - ${config.testName || 'UI'}`, () => {
		it('must not destructure import.meta.env', async () => {
			const violations = await checkViteEnvAccessStyle(config);
			expect(violations.filter((violation) => violation.includes('destructure import.meta.env'))).toStrictEqual([]);
		});

		it('must not use index access on import.meta.env', async () => {
			const violations = await checkViteEnvAccessStyle(config);
			expect(violations.filter((violation) => violation.includes('index access on import.meta.env'))).toStrictEqual([]);
		});

		it('must use property access for import.meta.env', async () => {
			const violations = await checkViteEnvAccessStyle(config);
			expect(violations).toStrictEqual([]);
		});
	});
}
