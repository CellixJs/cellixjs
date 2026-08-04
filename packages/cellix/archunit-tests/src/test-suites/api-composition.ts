import { describe, expect, it } from 'vitest';
import { type ApiCompositionConfig, checkApiComposition } from '../checks/api-composition.js';

/**
 * Register reusable fitness tests for a Cellix API composition root.
 * @param config - Location of the consumer's API composition entrypoint.
 * @returns Nothing; tests are registered with the active Vitest suite.
 * @example `describeApiCompositionTests({ apiIndexPath: 'src/index.ts' });`
 */
export function describeApiCompositionTests(config: ApiCompositionConfig): void {
	describe('Cellix API composition', () => {
		it('initializes infrastructure, context, application services, handlers, and startup in order', async () => {
			expect(await checkApiComposition(config)).toStrictEqual([]);
		});
	});
}
