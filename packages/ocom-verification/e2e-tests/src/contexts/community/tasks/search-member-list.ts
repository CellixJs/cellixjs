import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { MemberListPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Interaction, the } from '@serenity-js/core';
import type { E2EMemberListPage } from '../../../shared/page-contracts.ts';

export const SearchMemberList = (searchTerm: string) =>
	Interaction.where(the`#actor searches the member list for "${searchTerm}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		const memberListPage: E2EMemberListPage = new MemberListPage(new PlaywrightPageAdapter(page));
		await memberListPage.searchByMemberName(searchTerm);
	});
