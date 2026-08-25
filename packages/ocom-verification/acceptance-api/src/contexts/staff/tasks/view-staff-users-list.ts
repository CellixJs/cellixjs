import { type Actor, notes, Task } from '@serenity-js/core';
import { listStaffUsers } from '../../../shared/abilities/staff-user.ts';
import type { StaffUserManagementApiNotes } from '../notes/staff-user-management-notes.ts';

export class ViewStaffUsersList extends Task {
	static forCurrentActor() {
		return new ViewStaffUsersList();
	}

	private constructor() {
		super('views staff users list');
	}

	async performAs(actor: Actor): Promise<void> {
		const staffUsers = await listStaffUsers(actor);
		await actor.attemptsTo(
			notes<StaffUserManagementApiNotes>().set('result', 'list-visible'),
			notes<StaffUserManagementApiNotes>().set('activityLog', staffUsers.map((user) => user.displayName)),
		);
	}

	override toString = () => 'views staff users list';
}
