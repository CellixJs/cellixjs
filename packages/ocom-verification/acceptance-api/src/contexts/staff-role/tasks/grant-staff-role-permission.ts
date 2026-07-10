import { type Actor, notes, Task } from '@serenity-js/core';
import { UpdateStaffRole as UpdateStaffRoleAbility } from '../../../shared/abilities/update-staff-role.ts';
import type { StaffRoleNotes } from '../notes/staff-role-notes.ts';
import { StaffRoleNamed } from '../questions/staff-role-named.ts';

/**
 * Task that grants a single permission to an existing staff role through the
 * API and records the outcome in actor notes.
 */
export class GrantStaffRolePermission extends Task {
	static grant(permissionKey: string) {
		return {
			to: (roleName: string) => new GrantStaffRolePermission(permissionKey, roleName),
		};
	}

	private constructor(
		private readonly permissionKey: string,
		private readonly roleName: string,
	) {
		super(`grants the permission "${permissionKey}" to the staff role "${roleName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const role = await actor.answer(StaffRoleNamed.called(this.roleName));
		if (!role) {
			throw new Error(`Staff role "${this.roleName}" was not found`);
		}

		const updated = await UpdateStaffRoleAbility.as(actor).performAs(actor, {
			id: role.id,
			roleName: role.roleName,
			enterpriseAppRole: role.enterpriseAppRole,
			permissions: { [this.permissionKey]: true },
		});

		await actor.attemptsTo(notes<StaffRoleNotes>().set('lastStaffRoleId', updated.id), notes<StaffRoleNotes>().set('lastStaffRoleName', updated.roleName), notes<StaffRoleNotes>().set('lastStaffRoleStatus', 'SUCCESS'));
	}

	override toString = () => `grants the permission "${this.permissionKey}" to the staff role "${this.roleName}"`;
}
