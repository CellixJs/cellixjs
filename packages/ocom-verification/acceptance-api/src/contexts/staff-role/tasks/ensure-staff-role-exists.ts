import { type Actor, Task } from '@serenity-js/core';
import { CreateStaffRole as CreateStaffRoleAbility } from '../../../shared/abilities/create-staff-role.ts';
import { StaffRoleNamed } from '../questions/staff-role-named.ts';

const DEFAULT_ENTERPRISE_APP_ROLE = 'Staff.CaseManager';

/**
 * Given-glue task that makes sure a staff role with the given name exists,
 * creating it through the API when absent.
 */
export class EnsureStaffRoleExists extends Task {
	static named(roleName: string) {
		return new EnsureStaffRoleExists(roleName);
	}

	private constructor(private readonly roleName: string) {
		super(`makes sure a staff role named "${roleName}" exists`);
	}

	async performAs(actor: Actor): Promise<void> {
		const existing = await actor.answer(StaffRoleNamed.called(this.roleName));
		if (existing) {
			return;
		}

		try {
			await CreateStaffRoleAbility.as(actor).performAs(actor, { roleName: this.roleName, enterpriseAppRole: DEFAULT_ENTERPRISE_APP_ROLE });
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Could not set up staff role "${this.roleName}": ${message}`);
		}
	}

	override toString = () => `makes sure a staff role named "${this.roleName}" exists`;
}
