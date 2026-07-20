import { type Actor, notes, Task } from '@serenity-js/core';
import { CreateStaffRole as CreateStaffRoleAbility } from '../../../shared/abilities/create-staff-role.ts';
import type { StaffRoleDetails, StaffRoleNotes } from '../notes/staff-role-notes.ts';

/**
 * Task that creates a staff role through the API and records the outcome in actor notes.
 */
export class CreateStaffRole extends Task {
	static with(details: StaffRoleDetails) {
		return new CreateStaffRole(details);
	}

	private constructor(private readonly details: StaffRoleDetails) {
		super(`creates a staff role named "${details.roleName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const staffRole = await CreateStaffRoleAbility.as(actor).performAs(actor, this.details);

		await actor.attemptsTo(notes<StaffRoleNotes>().set('lastStaffRoleId', staffRole.id), notes<StaffRoleNotes>().set('lastStaffRoleName', staffRole.roleName), notes<StaffRoleNotes>().set('lastStaffRoleStatus', 'SUCCESS'));
	}

	override toString = () => `creates a staff role named "${this.details.roleName}"`;
}
