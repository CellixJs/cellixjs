import { setWorldConstructor, World } from '@cucumber/cucumber';
import { engage } from '@serenity-js/core';
import './shared/support/hooks.ts';
import { CellixE2ECast } from './shared/support/cast.ts';
import * as infra from './shared/support/shared-infrastructure.ts';

export async function stopSharedServers(): Promise<void> {
	await infra.stopAll();
}

export class CellixE2EWorld extends World {
	async init(): Promise<void> {
		await infra.ensureE2EServers();

		const { browseTheWeb } = infra.getState();
		if (!browseTheWeb) {
			throw new Error('BrowseTheWeb ability not initialized');
		}

		engage(new CellixE2ECast(browseTheWeb));
	}

	async cleanup(): Promise<void> {
		// Reuse same browser session across scenarios.
	}
}

setWorldConstructor(CellixE2EWorld);
