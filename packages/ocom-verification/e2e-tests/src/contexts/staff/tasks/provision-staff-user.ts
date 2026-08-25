import { type Actor, Task } from '@serenity-js/core';
import { detailPageOn, openUsersList, staffPortalPageOf } from '../abilities/staff-portal-page.ts';

export class ProvisionStaffUser extends Task {
	static withDefaults(userName: string, role: string) {
		return new ProvisionStaffUser(userName, role);
	}

	private constructor(
		private readonly userName: string,
		private readonly role: string,
	) {
		super(`provisions staff user "${userName}" with role "${role}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const page = await staffPortalPageOf(actor as never);
		const listPage = await openUsersList(page);
		if (!(await listPage.hasUserNamed(this.userName))) {
			throw new Error(`Expected newly provisioned staff user "${this.userName}" to appear in the UI`);
		}
		await listPage.clickRowForUser(this.userName);
		await page.waitForURL((url) => url.pathname.includes('/staff/user-management/staff-users/'), { timeout: 20_000 });
		const detailPage = detailPageOn(page);
		const actualRole = await detailPage.roleValueText();
		if (actualRole !== this.role) {
			throw new Error(`Expected staff user "${this.userName}" to have role "${this.role}", but the UI shows "${actualRole}"`);
		}
	}

	override toString = () => `provisions staff user "${this.userName}" with role "${this.role}"`;
}
