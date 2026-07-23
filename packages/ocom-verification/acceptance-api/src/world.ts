import { registerManagedSerenityWorld } from '@cellix/serenity-framework/cucumber';
import type { ApiInfrastructureState } from '@cellix/serenity-framework/infrastructure/api';
import { SerenityCast } from '@cellix/serenity-framework/serenity';
import { registerLifecycleHooks } from './cucumber-lifecycle-hooks.ts';
import { infrastructure } from './infrastructure.ts';
import { assignMemberAccountAbility } from './shared/abilities/assign-member-account.ts';
import { assignStaffRoleAbility } from './shared/abilities/assign-staff-role.ts';
import { createCommunityAbility } from './shared/abilities/create-community.ts';
import { createStaffRoleAbility } from './shared/abilities/create-staff-role.ts';
import { createGraphQLClientAbility } from './shared/abilities/graphql-client.ts';
import { listMembersAbility } from './shared/abilities/list-members.ts';
import { removeMemberAbility } from './shared/abilities/remove-member.ts';
import { updateMemberProfileAbility } from './shared/abilities/update-member-profile.ts';
import { updateMemberRoleAbility } from './shared/abilities/update-member-role.ts';
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
				() => listMembersAbility(),
				() => assignMemberAccountAbility(),
				() => updateMemberProfileAbility(),
				() => removeMemberAbility(),
				() => updateMemberRoleAbility(),
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
