import { registerManagedSerenityWorld } from '@cellix/serenity-framework/cucumber';
import { SerenityCast } from '@cellix/serenity-framework/serenity';
import { createCommunityAbility } from './shared/abilities/create-community.ts';
import { createGraphQLClientAbility } from './shared/abilities/graphql-client.ts';
import './shared/cucumber-lifecycle-hooks.ts';
import * as infra from './shared/shared-infrastructure.ts';

export async function stopSharedServers(): Promise<void> {
	await infra.stopAll();
}

export const CellixApiWorld = registerManagedSerenityWorld({
	infrastructure: {
		ensureStarted: infra.ensureApiServers,
		getState: infra.getState,
		resetScenarioState: infra.resetMongoForScenario,
		stopAll: infra.stopAll,
	},
	validateState: (state) => {
		if (!state.apiUrl) {
			throw new Error('API acceptance infrastructure did not expose an apiUrl');
		}
	},
	createCast: (state) =>
		new SerenityCast({
			useNotepad: true,
			abilities: [() => createGraphQLClientAbility(state.apiUrl ?? ''), () => createCommunityAbility()],
		}),
});

export type CellixApiWorld = InstanceType<typeof CellixApiWorld>;
