import { type Actor, notes, Task } from '@serenity-js/core';
import type { StaffUserManagementE2ENotes } from '../notes/staff-user-management-notes.ts';

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
		await actor.attemptsTo(notes<StaffUserManagementE2ENotes>().set('staffUserName', this.userName), notes<StaffUserManagementE2ENotes>().set('role', this.role));
	}

	override toString = () => `provisions staff user "${this.userName}" with role "${this.role}"`;
}
