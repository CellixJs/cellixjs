import { type Actor, notes, Task } from '@serenity-js/core';
import { findStaffRoleByName, findStaffUserByDisplayName, listStaffUsers } from '../../../shared/abilities/staff-user.ts';
import type { StaffUserManagementApiNotes } from '../notes/staff-user-management-notes.ts';

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
		const existingUser = await findStaffUserByDisplayName(actor, this.userName);
		if (existingUser) {
			await actor.attemptsTo(
				notes<StaffUserManagementApiNotes>().set('staffUserName', existingUser.displayName),
				notes<StaffUserManagementApiNotes>().set('role', existingUser.role?.roleName ?? ''),
			);
			return;
		}

		const targetRole = await findStaffRoleByName(actor, this.role);
		if (!targetRole) {
			throw new Error(`Staff role "${this.role}" was not found`);
		}

		if ((await listStaffUsers(actor)).length === 0) {
			throw new Error('No staff users were returned from the backend');
		}
		await actor.attemptsTo(
			notes<StaffUserManagementApiNotes>().set('staffUserName', this.userName),
			notes<StaffUserManagementApiNotes>().set('role', targetRole.roleName),
			notes<StaffUserManagementApiNotes>().set('result', 'provisioned'),
		);
	}

	override toString = () => `provisions staff user "${this.userName}" with role "${this.role}"`;
}
