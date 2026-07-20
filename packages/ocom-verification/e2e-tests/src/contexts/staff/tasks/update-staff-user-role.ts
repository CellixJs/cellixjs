import { type Actor, notes, Task } from '@serenity-js/core';
import type { StaffUserManagementE2ENotes } from '../notes/staff-user-management-notes.ts';

export class UpdateStaffUserRole extends Task {
	static forUser(userName: string, role: string) {
		return new UpdateStaffUserRole(userName, role);
	}

	private constructor(private readonly userName: string, private readonly role: string) {
		super(`updates staff user "${userName}" to role "${role}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		await actor.attemptsTo(
			notes<StaffUserManagementE2ENotes>().set('staffUserName', this.userName),
			notes<StaffUserManagementE2ENotes>().set('role', this.role),
		);
	}

	override toString = () => `updates staff user "${this.userName}" to role "${this.role}"`;
}
