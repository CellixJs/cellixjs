import { registerManagedSerenityWorld } from '@cellix/serenity-framework/cucumber';
import { SerenityCast } from '@cellix/serenity-framework/serenity';
import './shared/cucumber-lifecycle-hooks.ts';
import { OAuth2Login } from './shared/abilities/oauth2-login.ts';
import * as infra from './shared/shared-infrastructure.ts';

export async function stopSharedServers(): Promise<void> {
	await infra.stopAll();
}

export const CellixE2EWorld = registerManagedSerenityWorld({
	infrastructure: {
		ensureStarted: infra.ensureE2EServers,
		getState: infra.getState,
		resetScenarioState: infra.resetScenarioState,
		stopAll: infra.stopAll,
	},
	validateState: (state) => {
		if (!state.browseTheWeb) {
			throw new Error('BrowseTheWeb ability not initialized');
		}
	},
	createCast: (state) =>
		new SerenityCast({
			useNotepad: true,
			abilities: [
				() => {
					if (!state.browseTheWeb) {
						throw new Error('BrowseTheWeb ability not initialized');
					}
					return state.browseTheWeb;
				},
				() => OAuth2Login.throughProtectedRoute('/community/accounts'),
			],
		}),
});

export type CellixE2EWorld = InstanceType<typeof CellixE2EWorld>;
