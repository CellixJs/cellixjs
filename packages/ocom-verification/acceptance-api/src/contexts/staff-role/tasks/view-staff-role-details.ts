import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, notes, Task } from '@serenity-js/core';
import { STAFF_ROLE_BY_ID_QUERY, type StaffRoleResult } from '../../../shared/graphql/staff-role-operations.ts';
import type { StaffRoleNotes } from '../notes/staff-role-notes.ts';
import { StaffRoleNamed } from '../questions/staff-role-named.ts';

/**
 * Task that retrieves the details of a named staff role by id through the API
 * and records the viewed fields in actor notes.
 */
export class ViewStaffRoleDetails extends Task {
	static of(roleName: string) {
		return new ViewStaffRoleDetails(roleName);
	}

	private constructor(private readonly roleName: string) {
		super(`views the details of the staff role "${roleName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const role = await actor.answer(StaffRoleNamed.called(this.roleName));
		if (!role) {
			throw new Error(`Staff role "${this.roleName}" was not found`);
		}

		const response = await GraphQLClient.as(actor).execute(STAFF_ROLE_BY_ID_QUERY, { id: role.id });
		const details = response.data.staffRoleById as StaffRoleResult | null;
		if (!details) {
			throw new Error(`Staff role "${this.roleName}" (${role.id}) could not be retrieved by id`);
		}

		await actor.attemptsTo(
			notes<StaffRoleNotes>().set('viewedStaffRoleId', details.id),
			notes<StaffRoleNotes>().set('viewedStaffRoleName', details.roleName),
			notes<StaffRoleNotes>().set('viewedStaffRoleEnterpriseAppRole', details.enterpriseAppRole),
		);
	}

	override toString = () => `views the details of the staff role "${this.roleName}"`;
}
