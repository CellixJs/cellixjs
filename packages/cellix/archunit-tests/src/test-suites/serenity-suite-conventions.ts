import { describe, expect, it } from 'vitest';
import { checkSerenitySuiteConventions, type SerenitySuiteConventionsConfig } from '../checks/serenity-suite-conventions.js';

/**
 * Register reusable fitness tests for a Cellix Serenity/Cucumber suite.
 * @param config - Suite source root and cleanup policy. Context directories are discovered automatically.
 * @returns Nothing; tests are registered with the active Vitest suite.
 * @example `describeSerenitySuiteConventionTests({ suiteRoot: 'src', requireManagedCleanup: true });`
 */
export function describeSerenitySuiteConventionTests(config: SerenitySuiteConventionsConfig): void {
	describe('Cellix Serenity suite conventions', () => {
		it('uses a managed world and lifecycle', async () => {
			const violations = await checkSerenitySuiteConventions(config);
			expect(violations.filter((violation) => violation.includes('world.ts') || violation.includes('lifecycle'))).toStrictEqual([]);
		});

		it('loads context indexes and delegates steps to Screenplay abstractions', async () => {
			const violations = await checkSerenitySuiteConventions(config);
			expect(violations.filter((violation) => !violation.includes('world.ts') && !violation.includes('lifecycle'))).toStrictEqual([]);
		});
	});
}
