import { registerWorldLifecycleHooks } from '@cellix/serenity-framework/cucumber';
import { getTimeout } from '@cellix/serenity-framework/settings';
import type { IWorld } from '@cucumber/cucumber';
import { seedDatabase } from '@ocom-verification/verification-shared/test-data';
import { isAgent } from 'std-env';
import { infrastructure } from './infrastructure.ts';
import { mongoDbName, testMongoServer } from './servers/test-mongo-server.ts';
import { clearActorTokens } from './shared/abilities/actor-auth.ts';
import type { CellixApiWorld } from './world.ts';

let printedSuiteHeader = false;

/** Register the Cucumber Before/After/AfterAll hooks for the API acceptance suite. */
export function registerLifecycleHooks(): void {
	registerWorldLifecycleHooks<IWorld & CellixApiWorld>({
		scenarioTimeout: getTimeout('scenario'),
		before: async (world) => {
			if (!printedSuiteHeader && !isAgent) {
				printedSuiteHeader = true;
				console.log('\nAPI acceptance tests');
				console.log('  - Community context\n');
			}

			clearActorTokens();
			// Restore the seeded fixtures so update scenarios always start from a
			// known baseline regardless of what previous scenarios modified.
			if (testMongoServer.isRunning()) {
				await seedDatabase({ connectionString: testMongoServer.getConnectionString(), dbName: mongoDbName });
			}
			await world.init();
		},
		after: async (world) => {
			await world.cleanup();
		},
		afterAll: () => infrastructure.stopAll(),
	});
}
