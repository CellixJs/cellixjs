import { type Actor, notes, Task } from '@serenity-js/core';
import { findStaffUserByDisplayName, loadStaffUserById } from '../../../shared/abilities/staff-user.ts';
import type { StaffUserManagementApiNotes } from '../notes/staff-user-management-notes.ts';

export class ViewStaffUserDetails extends Task {
	static forUser(userName: string) {
		return new ViewStaffUserDetails(userName);
	}

	private constructor(private readonly userName: string) {
		super(`views details for staff user "${userName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const targetUser = await findStaffUserByDisplayName(actor, this.userName);
		if (!targetUser) {
			throw new Error(`Staff user "${this.userName}" was not found`);
		}

		const details = await loadStaffUserById(actor, targetUser.id);
		await actor.attemptsTo(
			notes<StaffUserManagementApiNotes>().set('staffUserName', details.displayName),
			notes<StaffUserManagementApiNotes>().set('role', details.role?.roleName ?? ''),
			notes<StaffUserManagementApiNotes>().set('result', 'details-visible'),
		);
	}

	override toString = () => `views details for staff user "${this.userName}"`;
}
