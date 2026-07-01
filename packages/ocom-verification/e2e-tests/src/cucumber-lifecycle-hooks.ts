import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerWorldLifecycleHooks } from '@cellix/serenity-framework/cucumber';
import { registerScreenshotOnFailureHook } from '@cellix/serenity-framework/cucumber/screenshot';
import { getTimeout } from '@cellix/serenity-framework/settings';
import type { IWorld } from '@cucumber/cucumber';
import { infrastructure } from './infrastructure.ts';
import type { CellixE2EWorld } from './world.ts';

const currentDir = fileURLToPath(new URL('.', import.meta.url));

/** Register the Cucumber Before/After/AfterAll and screenshot hooks for the E2E suite. */
export function registerLifecycleHooks(): void {
	registerWorldLifecycleHooks<IWorld & CellixE2EWorld>({
		scenarioTimeout: getTimeout('scenario'),
		// The first Before cold-boots all servers + the browser, which exceeds the
		// per-scenario budget on a cold machine; give it a dedicated boot timeout.
		beforeTimeout: getTimeout('boot'),
		before: async (world) => {
			await world.init();
		},
		after: async (world) => {
			await world.cleanup();
		},
		afterAll: () => infrastructure.stopAll(),
	});

	registerScreenshotOnFailureHook({
		reportsDir: path.resolve(currentDir, '..', '..', 'reports', 'screenshots'),
	});
}
