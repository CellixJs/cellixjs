import { type Actor, Task } from '@serenity-js/core';
import { currentMockPath } from '../../staff-role/abilities/mock-staff-role-backend.ts';
import { detailPageFor, listPageFor, RenderStaffUsersScreen, waitUntilUi } from './staff-user-screen.ts';

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
		await actor.attemptsTo(RenderStaffUsersScreen());
		const listPage = listPageFor(actor);
		await waitUntilUi(async () => await listPage.hasUserNamed(this.userName), `Expected the staff users list to include "${this.userName}"`);
		await listPage.clickRowForUser(this.userName);
		const detailPage = detailPageFor(actor);
		await waitUntilUi(async () => await detailPage.heading.isVisible(), `Expected the detail page for "${this.userName}" to render`);
		if ((await detailPage.roleSelectDisabled()) || (await detailPage.saveButtonDisabled())) {
			await waitUntilUi(async () => currentMockPath() === '/unauthorized' || (await detailPage.saveButtonDisabled()), 'Expected the role assignment UI to be disabled or redirected');
			return;
		}
		await detailPage.selectRole(this.role);
		await detailPage.saveButton.click();
		await waitUntilUi(async () => {
			const text = document.body.textContent ?? '';
			return text.includes('Role assigned successfully') || text.includes('Failed to assign role');
		}, 'Expected the role-assignment result to appear');
	}

	override toString = () => `updates staff user "${this.userName}" to role "${this.role}"`;
}
