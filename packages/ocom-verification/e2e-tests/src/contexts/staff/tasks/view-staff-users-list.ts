import { type Actor, notes, Task } from '@serenity-js/core';
import type { StaffUserManagementE2ENotes } from '../notes/staff-user-management-notes.ts';

export class ViewStaffUsersList extends Task {
	static forCurrentActor() {
		return new ViewStaffUsersList();
	}

	private constructor() {
		super('views staff users list');
	}

	async performAs(actor: Actor): Promise<void> {
		await actor.attemptsTo(notes<StaffUserManagementE2ENotes>().set('result', 'list-visible'));
	}

	override toString = () => 'views staff users list';
}
