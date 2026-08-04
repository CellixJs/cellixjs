import { describe, expect, it } from 'vitest';
import { checkUiAppComposition, type UiAppCompositionConfig } from '../checks/ui-app-composition.js';

/**
 * Register reusable fitness tests for a Cellix browser application entrypoint.
 * @param config - Source root and providers required by the consumer application.
 * @returns Nothing; tests are registered with the active Vitest suite.
 * @example `describeUiAppCompositionTests({ appRoot: 'src', requiredProviders: ['BrowserRouter'] });`
 */
export function describeUiAppCompositionTests(config: UiAppCompositionConfig): void {
	describe('Cellix UI application composition', () => {
		it('validates the mount point and composes providers, the app, and routes', async () => {
			expect(await checkUiAppComposition(config)).toStrictEqual([]);
		});
	});
}
