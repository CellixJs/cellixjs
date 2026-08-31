import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { MemberAccountsPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Task } from '@serenity-js/core';
import type { AcceptanceUiMemberAccountsPage } from '../../../shared/page-contracts.ts';

async function flushPendingReactWork(): Promise<void> {
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export const AssignMemberAccount = (): Task =>
	Task.where(
		'#actor assigns the selected end-user account to a member',
		new TaskStep<Actor>('#actor adds the selected member account', async () => {
			const page: AcceptanceUiMemberAccountsPage = new MemberAccountsPage(new DomPageAdapter(document.body));
			await page.clickAddMemberAccount();
			await flushPendingReactWork();
		}),
	);
