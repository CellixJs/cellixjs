import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { STAFF_ROLE_PERMISSION_GROUP_BY_KEY } from '../../../shared/graphql/staff-role-operations.ts';
import { StaffRoleNamed } from './staff-role-named.ts';

/**
 * Question that answers whether a named staff role has a permission granted,
 * read live from the API.
 */
export class StaffRolePermission extends Question<Promise<boolean>> {
	static granted(roleName: string, permissionKey: string): StaffRolePermission {
		return new StaffRolePermission(roleName, permissionKey);
	}

	private constructor(
		private readonly roleName: string,
		private readonly permissionKey: string,
	) {
		super(`whether the staff role "${roleName}" has the permission "${permissionKey}" granted`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<boolean> {
		const group = STAFF_ROLE_PERMISSION_GROUP_BY_KEY[this.permissionKey];
		if (!group) {
			throw new Error(`Unknown staff role permission "${this.permissionKey}"`);
		}

		const role = await actor.answer(StaffRoleNamed.called(this.roleName));
		if (!role) {
			throw new Error(`Staff role "${this.roleName}" was not found`);
		}

		return role.permissions[group]?.[this.permissionKey] === true;
	}

	override toString = () => `whether the staff role "${this.roleName}" has the permission "${this.permissionKey}" granted`;
}
