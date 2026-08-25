import { type Actor, notes, Task } from '@serenity-js/core';
import { assignStaffRoleToUser, findStaffRoleByName, findStaffUserByDisplayName } from '../../../shared/abilities/staff-user.ts';
import type { StaffUserManagementApiNotes } from '../notes/staff-user-management-notes.ts';

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
		const targetUser = await findStaffUserByDisplayName(actor, this.userName);
		if (!targetUser) {
			throw new Error(`Staff user "${this.userName}" was not found`);
		}

		const targetRole = await findStaffRoleByName(actor, this.role);
		if (!targetRole) {
			throw new Error(`Staff role "${this.role}" was not found`);
		}

		await assignStaffRoleToUser(actor, { staffUserId: targetUser.id, roleId: targetRole.id });
		await actor.attemptsTo(
			notes<StaffUserManagementApiNotes>().set('staffUserName', this.userName),
			notes<StaffUserManagementApiNotes>().set('role', this.role),
			notes<StaffUserManagementApiNotes>().set('result', 'allowed'),
		);
	}

	override toString = () => `updates staff user "${this.userName}" to role "${this.role}"`;
}
