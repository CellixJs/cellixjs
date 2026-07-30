import { type Actor, notes, Task } from '@serenity-js/core';
import { AssignStaffRole as AssignStaffRoleAbility } from '../../../shared/abilities/assign-staff-role.ts';
import type { StaffRoleNotes } from '../notes/staff-role-notes.ts';
import { StaffRoleNamed } from '../questions/staff-role-named.ts';
import { StaffUserNamed } from '../questions/staff-user-named.ts';

/**
 * Task that assigns a staff role to a staff user through the API and records
 * the outcome in actor notes.
 */
export class AssignStaffRoleToUser extends Task {
	static assign(roleName: string) {
		return {
			to: (staffUserDisplayName: string) => new AssignStaffRoleToUser(roleName, staffUserDisplayName),
		};
	}

	private constructor(
		private readonly roleName: string,
		private readonly staffUserDisplayName: string,
	) {
		super(`assigns the staff role "${roleName}" to the staff user "${staffUserDisplayName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const role = await actor.answer(StaffRoleNamed.called(this.roleName));
		if (!role) {
			throw new Error(`Staff role "${this.roleName}" was not found`);
		}

		const staffUser = await actor.answer(StaffUserNamed.called(this.staffUserDisplayName));

		await AssignStaffRoleAbility.as(actor).performAs(actor, { staffUserId: staffUser.id, roleId: role.id });

		await actor.attemptsTo(notes<StaffRoleNotes>().set('lastStaffRoleStatus', 'SUCCESS'));
	}

	override toString = () => `assigns the staff role "${this.roleName}" to the staff user "${this.staffUserDisplayName}"`;
}
