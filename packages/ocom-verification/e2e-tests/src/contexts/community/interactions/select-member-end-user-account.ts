import { type Actor, Interaction, the } from '@serenity-js/core';
import { communityPortalPageOf, memberAccountsPageOn } from '../abilities/community-portal-page.ts';

export const SelectMemberEndUserAccount = (actor: Actor, displayName: string) =>
	Interaction.where(the`#actor selects end-user account "${displayName}"`, async () => {
		const memberAccountsPage = memberAccountsPageOn(communityPortalPageOf(actor));
		await memberAccountsPage.selectEndUser(displayName);
	});
