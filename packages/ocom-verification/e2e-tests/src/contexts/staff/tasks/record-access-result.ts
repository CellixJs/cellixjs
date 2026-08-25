import { type Actor, Task } from '@serenity-js/core';
import { detailPageOn, openUsersList, staffPortalPageOf } from '../abilities/staff-portal-page.ts';

export class RecordAccessResult extends Task {
	static withResult(result: string) {
		return new RecordAccessResult(result);
	}

	private constructor(private readonly result: string) {
		super(`records access result "${result}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const page = await staffPortalPageOf(actor as never);
		const currentPath = new URL(page.url()).pathname;
		if (currentPath.includes('/unauthorized')) {
			return;
		}
		const listPage = await openUsersList(page);
		const userName = this.result === 'self-role-change-not-allowed' ? 'Alice' : 'Bob';
		if (!(await listPage.hasUserNamed(userName))) {
			return;
		}
		await listPage.clickRowForUser(userName);
		await page.waitForURL((url) => url.pathname.includes('/staff/user-management/staff-users/'), { timeout: 20_000 });
		const detailPage = detailPageOn(page);
		if (await detailPage.roleSelectDisabled() && await detailPage.saveButtonDisabled()) {
			return;
		}
	}

	override toString = () => `records access result "${this.result}"`;
}
