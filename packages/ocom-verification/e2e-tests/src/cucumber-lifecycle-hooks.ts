import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerWorldLifecycleHooks } from '@cellix/serenity-framework/cucumber';
import { registerScreenshotOnFailureHook } from '@cellix/serenity-framework/cucumber/screenshot';
import { getTimeout } from '@cellix/serenity-framework/settings';
import type { IWorld } from '@cucumber/cucumber';
import * as infra from './infrastructure.ts';
import type { CellixE2EWorld } from './world.ts';

const currentDir = fileURLToPath(new URL('.', import.meta.url));

/** Register the Cucumber Before/After/AfterAll and screenshot hooks for the E2E suite. */
export function registerLifecycleHooks(): void {
	registerWorldLifecycleHooks<IWorld & CellixE2EWorld>({
		beforeTimeout: getTimeout('serverStartup') + getTimeout('uiInit') * 3,
		scenarioTimeout: getTimeout('scenario'),
		before: async (world) => {
			await world.init();
		},
		after: async (world) => {
			await world.cleanup();
		},
		afterAll: () => infra.stopAll(),
	});

	registerScreenshotOnFailureHook({
		reportsDir: path.resolve(currentDir, '..', '..', 'reports', 'screenshots'),
	});
}
