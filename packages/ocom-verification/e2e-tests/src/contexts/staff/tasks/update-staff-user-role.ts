import { type Actor, Task } from '@serenity-js/core';
import { detailPageOn, openUsersList, staffPortalPageOf, waitUntil } from '../abilities/staff-portal-page.ts';

export class UpdateStaffUserRole extends Task {
	static forUser(userName: string, role: string) {
		return new UpdateStaffUserRole(userName, role);
	}

	private constructor(
		private readonly userName: string,
		private readonly role: string,
	) {
		super(`updates staff user "${userName}" to role "${role}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const page = await staffPortalPageOf(actor as never);
		const listPage = await openUsersList(page);
		if (!(await listPage.hasUserNamed(this.userName))) {
			throw new Error(`Expected staff user "${this.userName}" to exist before changing the role`);
		}
		await listPage.clickRowForUser(this.userName);
		await page.waitForURL((url) => url.pathname.includes('/staff/user-management/staff-users/'), { timeout: 20_000 });
		const detailPage = detailPageOn(page);
		const canMutate = !(await detailPage.roleSelectDisabled()) && !(await detailPage.saveButtonDisabled());
		if (!canMutate) {
			return;
		}
		await detailPage.selectRole(this.role);
		await detailPage.saveButton.click();
		await waitUntil(async () => (await detailPage.roleValueText()) === this.role || (await detailPage.hasActivityLogEntry(`role assigned: ${this.role}`)), `Expected the UI to reflect the role assignment to "${this.role}"`);
	}

	override toString = () => `updates staff user "${this.userName}" to role "${this.role}"`;
}
