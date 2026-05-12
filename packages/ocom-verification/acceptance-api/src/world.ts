import { setWorldConstructor, World } from '@cucumber/cucumber';
import { engage } from '@serenity-js/core';
import './shared/support/hooks.ts';
import { CellixApiCast } from './shared/support/cast.ts';
import * as infra from './shared/support/shared-infrastructure.ts';

export async function stopSharedServers(): Promise<void> {
	await infra.stopAll();
}

export class CellixApiWorld extends World {
	private apiUrl = '';

	async init(): Promise<void> {
		await infra.ensureApiServers();

		const { apiUrl } = infra.getState();
		if (apiUrl) {
			this.apiUrl = apiUrl;
		}

		engage(new CellixApiCast(this.apiUrl));
	}

	async cleanup(): Promise<void> {
		// Per-scenario cleanup — extend as needed.
	}
}

setWorldConstructor(CellixApiWorld);
