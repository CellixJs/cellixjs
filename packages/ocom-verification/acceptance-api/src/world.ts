import { registerManagedSerenityWorld } from '@cellix/serenity-framework/cucumber';
import type { ApiInfrastructureState } from '@cellix/serenity-framework/infrastructure/api';
import { SerenityCast } from '@cellix/serenity-framework/serenity';
import { registerLifecycleHooks } from './cucumber-lifecycle-hooks.ts';
import { infrastructure } from './infrastructure.ts';
import { assignStaffRoleAbility } from './shared/abilities/assign-staff-role.ts';
import { createCommunityAbility } from './shared/abilities/create-community.ts';
import { createPropertyAbility } from './shared/abilities/create-property.ts';
import { createStaffRoleAbility } from './shared/abilities/create-staff-role.ts';
import { deletePropertyAbility } from './shared/abilities/delete-property.ts';
import { createGraphQLClientAbility } from './shared/abilities/graphql-client.ts';
import { provisionDeactivatedPropertyManagerAbility } from './shared/abilities/provision-deactivated-property-manager.ts';
import { provisionMemberPropertyFixtureAbility } from './shared/abilities/provision-member-property-fixture.ts';
import { provisionResidentMemberAbility } from './shared/abilities/provision-resident-member.ts';
import { updatePropertyAbility } from './shared/abilities/update-property.ts';
import { updateStaffRoleAbility } from './shared/abilities/update-staff-role.ts';

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
			abilities: [
				(actor) => createGraphQLClientAbility(graphqlUrl(state), actor.name),
				() => createCommunityAbility(),
				() => createStaffRoleAbility(),
				() => updateStaffRoleAbility(),
				() => assignStaffRoleAbility(),
				() => createPropertyAbility(),
				() => updatePropertyAbility(),
				() => deletePropertyAbility(),
				() => provisionResidentMemberAbility(),
				() => provisionDeactivatedPropertyManagerAbility(),
				() => provisionMemberPropertyFixtureAbility(),
			],
		}),
});

export type CellixApiWorld = InstanceType<typeof CellixApiWorld>;

registerLifecycleHooks();

function graphqlUrl(state: ApiInfrastructureState): string {
	// biome-ignore lint:useLiteralKeys - servers is an index-signature record; bracket access required by noPropertyAccessFromIndexSignature
	const graphqlServer = state.servers['graphql'];
	return graphqlServer?.isRunning() ? graphqlServer.getUrl() : '';
}
