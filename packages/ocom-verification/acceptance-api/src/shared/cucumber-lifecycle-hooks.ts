import { registerWorldLifecycleHooks } from '@cellix/serenity-framework/cucumber';
import { getTimeout } from '@cellix/serenity-framework/settings';
import type { IWorld } from '@cucumber/cucumber';
import { isAgent } from 'std-env';
import { type CellixApiWorld, stopSharedServers } from '../world.ts';

let printedSuiteHeader = false;

registerWorldLifecycleHooks<IWorld & CellixApiWorld>({
	scenarioTimeout: getTimeout('scenario'),
	before: async (world) => {
		if (!printedSuiteHeader && !isAgent) {
			printedSuiteHeader = true;
			console.log('\nAPI acceptance tests');
			console.log('  - Community context\n');
		}

		await world.init();
	},
	after: async (world) => {
		await world.cleanup();
	},
	afterAll: stopSharedServers,
});
