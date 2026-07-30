import { type Actor, notes, Task } from '@serenity-js/core';
import type { StaffRoleNotes } from '../notes/staff-role-notes.ts';
import { StaffRolesList } from '../questions/staff-roles-list.ts';

/**
 * Task that reads the staff roles list from the API and records the visible
 * role names in actor notes.
 */
export class ViewStaffRolesList extends Task {
	static displayed() {
		return new ViewStaffRolesList();
	}

	private constructor() {
		super('views the staff roles list');
	}

	async performAs(actor: Actor): Promise<void> {
		const roles = await actor.answer(StaffRolesList.displayed());
		await actor.attemptsTo(
			notes<StaffRoleNotes>().set(
				'listedStaffRoleNames',
				roles.map((role) => role.roleName),
			),
		);
	}

	override toString = () => 'views the staff roles list';
}
