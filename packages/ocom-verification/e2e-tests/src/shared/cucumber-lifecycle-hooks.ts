import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerWorldLifecycleHooks } from '@cellix/serenity-framework/cucumber';
import { registerScreenshotOnFailureHook } from '@cellix/serenity-framework/cucumber/screenshot';
import { getTimeout } from '@cellix/serenity-framework/settings';
import type { IWorld } from '@cucumber/cucumber';
import { type CellixE2EWorld, stopSharedServers } from '../world.ts';

const currentDir = fileURLToPath(new URL('.', import.meta.url));

registerWorldLifecycleHooks<IWorld & CellixE2EWorld>({
	scenarioTimeout: getTimeout('scenario'),
	before: async (world) => {
		await world.init();
	},
	after: async (world) => {
		await world.cleanup();
	},
	afterAll: stopSharedServers,
});

registerScreenshotOnFailureHook({
	reportsDir: path.resolve(currentDir, '..', '..', '..', 'reports', 'screenshots'),
});
