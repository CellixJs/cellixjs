import type { IWorld } from '@cucumber/cucumber';
import { After, AfterAll, Before, setDefaultTimeout } from '@cucumber/cucumber';
import { getTimeout } from '@ocom-verification/verification-shared/settings';
import { isAgent } from 'std-env';
import { type CellixApiWorld, stopSharedServers } from '../../world.ts';

let printedSuiteHeader = false;

/** Default scenario timeout from centralized configuration */
setDefaultTimeout(getTimeout('scenario'));

Before(async function (this: IWorld) {
	const world = this as IWorld & CellixApiWorld;

	if (!printedSuiteHeader && !isAgent) {
		printedSuiteHeader = true;
		console.log('\nAPI acceptance tests');
		console.log('  - Community context\n');
	}

	await world.init();
});

After(async function (this: IWorld) {
	const world = this as IWorld & CellixApiWorld;
	await world.cleanup();
});

AfterAll(async () => {
	await stopSharedServers();
});
