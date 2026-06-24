import { registerManagedSerenityWorld } from '@cellix/serenity-framework/cucumber';
import { SerenityCast } from '@cellix/serenity-framework/serenity';
import { registerLifecycleHooks } from './cucumber-lifecycle-hooks.ts';
import { infrastructure } from './infrastructure.ts';
import { OAuth2Login } from './shared/abilities/oauth2-login.ts';

export const CellixE2EWorld = registerManagedSerenityWorld({
	infrastructure,
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

registerLifecycleHooks();
