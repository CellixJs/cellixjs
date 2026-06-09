import { registerManagedSerenityWorld } from '@cellix/serenity-framework/cucumber';
import type { ApiInfrastructureState } from '@cellix/serenity-framework/infrastructure/api';
import { SerenityCast } from '@cellix/serenity-framework/serenity';
import { registerLifecycleHooks } from './cucumber-lifecycle-hooks.ts';
import { infrastructure } from './infrastructure.ts';
import { createCommunityAbility } from './shared/abilities/create-community.ts';
import { createGraphQLClientAbility } from './shared/abilities/graphql-client.ts';

export const CellixApiWorld = registerManagedSerenityWorld({
	infrastructure,
	validateState: (state) => {
		if (!graphqlUrl(state)) {
			throw new Error('API acceptance infrastructure did not expose a graphqlUrl');
		}
	},
	createCast: (state) =>
		new SerenityCast({
			useNotepad: true,
			abilities: [() => createGraphQLClientAbility(graphqlUrl(state)), () => createCommunityAbility()],
		}),
});

export type CellixApiWorld = InstanceType<typeof CellixApiWorld>;

registerLifecycleHooks();

function graphqlUrl(state: ApiInfrastructureState): string {
	// biome-ignore lint:useLiteralKeys - servers is an index-signature record; bracket access required by noPropertyAccessFromIndexSignature
	const graphqlServer = state.servers['graphql'];
	return graphqlServer?.isRunning() ? graphqlServer.getUrl() : '';
}
