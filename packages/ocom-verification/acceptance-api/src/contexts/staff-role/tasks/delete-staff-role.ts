import { type Actor, notes, Task } from '@serenity-js/core';
import { DeleteStaffRole as DeleteStaffRoleAbility } from '../../../shared/abilities/delete-staff-role.ts';
import type { StaffRoleNotes } from '../notes/staff-role-notes.ts';
import { StaffRoleNamed } from '../questions/staff-role-named.ts';

/**
 * Task that deletes an existing staff role through the API and records the
 * outcome in actor notes.
 */
export class DeleteStaffRole extends Task {
	static named(roleName: string): DeleteStaffRole {
		return new DeleteStaffRole(roleName);
	}

	private constructor(private readonly roleName: string) {
		super(`deletes the staff role "${roleName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const role = await actor.answer(StaffRoleNamed.called(this.roleName));
		if (!role) {
			throw new Error(`Staff role "${this.roleName}" was not found`);
		}

		await DeleteStaffRoleAbility.as(actor).performAs(actor, role.id);

		await actor.attemptsTo(notes<StaffRoleNotes>().set('lastStaffRoleId', role.id), notes<StaffRoleNotes>().set('lastStaffRoleName', role.roleName), notes<StaffRoleNotes>().set('lastStaffRoleStatus', 'SUCCESS'));
	}

	override toString = () => `deletes the staff role "${this.roleName}"`;
}
