import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerWorldLifecycleHooks } from '@cellix/serenity-framework/cucumber';
import { registerScreenshotOnFailureHook } from '@cellix/serenity-framework/cucumber/screenshot';
import { getTimeout } from '@cellix/serenity-framework/settings';
import type { IWorld } from '@cucumber/cucumber';
import { seedDatabase } from '@ocom-verification/verification-shared/test-data';
import { infrastructure } from './infrastructure.ts';
import { mongoDbName, testMongoServer } from './servers/test-mongo-server.ts';
import { closeCommunityPortalSessions } from './shared/abilities/community-portal-session.ts';
import type { CellixE2EWorld } from './world.ts';

const currentDir = fileURLToPath(new URL('.', import.meta.url));

/** Register the Cucumber Before/After/AfterAll and screenshot hooks for the E2E suite. */
export function registerLifecycleHooks(): void {
	registerWorldLifecycleHooks<IWorld & CellixE2EWorld>({
		beforeTimeout: getTimeout('serverStartup') + getTimeout('uiInit') * 3,
		scenarioTimeout: getTimeout('scenario'),
		before: async (world) => {
			// Restore the seeded fixtures so settings-update scenarios always start
			// from a known baseline regardless of what previous scenarios modified.
			if (testMongoServer.isRunning()) {
				await seedDatabase({ connectionString: testMongoServer.getConnectionString(), dbName: mongoDbName });
			}
			await world.init();
		},
		after: async (world) => {
			await world.cleanup();
		},
		afterAll: async () => {
			await closeCommunityPortalSessions();
			await infrastructure.stopAll();
		},
	});

	registerScreenshotOnFailureHook({
		reportsDir: path.resolve(currentDir, '..', '..', 'reports', 'screenshots'),
	});
}
