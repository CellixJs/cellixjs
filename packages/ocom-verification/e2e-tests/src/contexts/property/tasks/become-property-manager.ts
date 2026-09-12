import { actors } from '@ocom-verification/verification-shared/test-data';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { LogInWithOAuth2 } from '../../../shared/abilities/oauth2-login.ts';
import { CreateCommunity } from '../../community/tasks/create-community.ts';
import { clearScenarioPropertyIds } from '../abilities/admin-portal-page.ts';
import { OpenAdminPortal } from '../interactions/open-admin-portal.ts';
import type { PropertyE2ENotes } from '../notes/property-notes.ts';

// Each scenario provisions its own managed community because the test mongo
// database is cleared and re-seeded before every scenario.
let communitySequence = 0;

/**
 * Given-glue task that signs the actor in as a community owner, provisions a
 * managed community, and lands in its admin portal, where the owner's
 * provisioned admin role grants the manage-properties permission.
 */
export const BecomePropertyManager = () =>
	Interaction.where(the`#actor becomes the property manager of a community`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		clearScenarioPropertyIds();
		await actor.attemptsTo(LogInWithOAuth2(actors.CommunityOwner.email));
		await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', null), notes<PropertyE2ENotes>().set('lastPropertyError', null));

		communitySequence += 1;
		const communityName = `Property E2E ${Date.now()}-${communitySequence}`;
		await actor.attemptsTo(CreateCommunity(communityName));
		await actor.attemptsTo(OpenAdminPortal(communityName));
	});
