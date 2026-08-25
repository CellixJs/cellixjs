import { type Actor, Task } from '@serenity-js/core';
import { detailPageOn, openUsersList, staffPortalPageOf } from '../abilities/staff-portal-page.ts';

export class ViewStaffUserDetails extends Task {
	static forUser(userName: string) {
		return new ViewStaffUserDetails(userName);
	}

	private constructor(private readonly userName: string) {
		super(`views details for staff user "${userName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const page = await staffPortalPageOf(actor as never);
		const listPage = await openUsersList(page);
		if (!(await listPage.hasUserNamed(this.userName))) {
			throw new Error(`Expected staff user "${this.userName}" to appear in the staff users list`);
		}
		await listPage.clickRowForUser(this.userName);
		await page.waitForURL((url) => url.pathname.includes('/staff/user-management/staff-users/') && url.pathname !== '/staff/user-management/staff-users', { timeout: 20_000 });
		const detailPage = detailPageOn(page);
		if (!(await detailPage.heading.isVisible())) {
			throw new Error(`Expected the staff user details page for "${this.userName}" to be visible`);
		}
	}

	override toString = () => `views details for staff user "${this.userName}"`;
}
