import { registerWorldLifecycleHooks } from '@cellix/serenity-framework/cucumber';
import { getTimeout } from '@cellix/serenity-framework/settings';
import type { IWorld } from '@cucumber/cucumber';
import { isAgent } from 'std-env';
import { infrastructure } from './infrastructure.ts';
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
			await world.init();
		},
		after: async (world) => {
			await world.cleanup();
		},
		afterAll: () => infrastructure.stopAll(),
	});
}
