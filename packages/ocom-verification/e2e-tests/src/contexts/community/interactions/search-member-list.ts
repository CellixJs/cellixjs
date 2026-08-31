import { type Actor, Interaction, the } from '@serenity-js/core';
import { communityPortalPageOf, memberListPageOn } from '../abilities/community-portal-page.ts';

export const SearchMemberList = (actor: Actor, searchTerm: string) =>
	Interaction.where(the`#actor searches the member list for "${searchTerm}"`, async () => {
		const memberListPage = memberListPageOn(communityPortalPageOf(actor));
		await memberListPage.searchByMemberName(searchTerm);
	});
