import { type Actor, notes, Task } from '@serenity-js/core';
import { UpdateStaffRole as UpdateStaffRoleAbility } from '../../../shared/abilities/update-staff-role.ts';
import type { StaffRoleNotes } from '../notes/staff-role-notes.ts';
import { StaffRoleNamed } from '../questions/staff-role-named.ts';

/**
 * Task that renames an existing staff role through the API and records the
 * outcome in actor notes.
 */
export class RenameStaffRole extends Task {
	static from(currentName: string) {
		return {
			to: (newName: string) => new RenameStaffRole(currentName, newName),
		};
	}

	private constructor(
		private readonly currentName: string,
		private readonly newName: string,
	) {
		super(`renames the staff role "${currentName}" to "${newName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const role = await actor.answer(StaffRoleNamed.called(this.currentName));
		if (!role) {
			throw new Error(`Staff role "${this.currentName}" was not found`);
		}

		const updated = await UpdateStaffRoleAbility.as(actor).performAs(actor, {
			id: role.id,
			roleName: this.newName,
			enterpriseAppRole: role.enterpriseAppRole,
		});

		await actor.attemptsTo(notes<StaffRoleNotes>().set('lastStaffRoleId', updated.id), notes<StaffRoleNotes>().set('lastStaffRoleName', updated.roleName), notes<StaffRoleNotes>().set('lastStaffRoleStatus', 'SUCCESS'));
	}

	override toString = () => `renames the staff role "${this.currentName}" to "${this.newName}"`;
}
