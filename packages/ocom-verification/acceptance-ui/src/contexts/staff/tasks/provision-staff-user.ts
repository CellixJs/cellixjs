import { type Actor, Task } from '@serenity-js/core';
import { setStaffUserUiState } from '../abilities/mock-staff-user-backend.ts';
import { listPageFor, RenderStaffUsersScreen, waitUntilUi } from './staff-user-screen.ts';

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
		setStaffUserUiState(this.userName, this.role);
		await actor.attemptsTo(RenderStaffUsersScreen());
		const listPage = listPageFor(actor);
		await waitUntilUi(async () => await listPage.hasUserNamed(this.userName), `Expected "${this.userName}" to appear in the staff users list`);
	}

	override toString = () => `provisions staff user "${this.userName}" with role "${this.role}"`;
}
