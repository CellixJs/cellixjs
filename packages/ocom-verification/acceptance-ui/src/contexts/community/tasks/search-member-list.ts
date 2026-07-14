import { RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { MemberListPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Task } from '@serenity-js/core';
import type { AcceptanceUiMemberListPage } from '../../../shared/page-contracts.ts';

export const SearchMemberList = (searchTerm: string): Task =>
	Task.where(
		`#actor searches the member list for "${searchTerm}"`,
		new TaskStep<Actor>(`#actor enters "${searchTerm}" in the member search`, async (actor) => {
			const page: AcceptanceUiMemberListPage = new MemberListPage(new DomPageAdapter(RenderInDom.as(actor).container));
			await page.searchByMemberName(searchTerm);
		}),
	);
