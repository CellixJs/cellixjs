import { type Actor, notes, Task } from '@serenity-js/core';
import type { StaffUserManagementApiNotes } from '../notes/staff-user-management-notes.ts';

export class ViewStaffUserDetails extends Task {
	static forUser(userName: string) {
		return new ViewStaffUserDetails(userName);
	}

	private constructor(private readonly userName: string) {
		super(`views details for staff user "${userName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		await actor.attemptsTo(notes<StaffUserManagementApiNotes>().set('staffUserName', this.userName), notes<StaffUserManagementApiNotes>().set('result', 'details-visible'));
	}

	override toString = () => `views details for staff user "${this.userName}"`;
}
