import { registerManagedSerenityWorld } from '@cellix/serenity-framework/cucumber';
import { SerenityCast } from '@cellix/serenity-framework/serenity';
import { registerLifecycleHooks } from './cucumber-lifecycle-hooks.ts';
import * as infra from './infrastructure.ts';
import { createCommunityAbility } from './shared/abilities/create-community.ts';
import { createGraphQLClientAbility } from './shared/abilities/graphql-client.ts';

export const CellixApiWorld = registerManagedSerenityWorld({
	infrastructure: {
		ensureStarted: infra.ensureApiServers,
		getState: infra.getState,
		resetScenarioState: infra.resetMongoForScenario,
		stopAll: infra.stopAll,
	},
	validateState: (state) => {
		if (!state.graphqlUrl) {
			throw new Error('API acceptance infrastructure did not expose a graphqlUrl');
		}
	},
	createCast: (state) =>
		new SerenityCast({
			useNotepad: true,
			abilities: [() => createGraphQLClientAbility(state.graphqlUrl ?? ''), () => createCommunityAbility()],
		}),
});

export type CellixApiWorld = InstanceType<typeof CellixApiWorld>;

registerLifecycleHooks();
