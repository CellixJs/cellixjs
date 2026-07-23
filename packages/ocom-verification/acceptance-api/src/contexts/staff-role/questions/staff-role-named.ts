import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import type { StaffRoleResult } from '../../../shared/graphql/staff-role-operations.ts';
import { StaffRolesList } from './staff-roles-list.ts';

/**
 * Question that finds a staff role by its role name through the API.
 * Answers `undefined` when no staff role with that name exists.
 */
export class StaffRoleNamed extends Question<Promise<StaffRoleResult | undefined>> {
	static called(roleName: string): StaffRoleNamed {
		return new StaffRoleNamed(roleName);
	}

	private constructor(private readonly roleName: string) {
		super(`the staff role named "${roleName}"`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<StaffRoleResult | undefined> {
		const roles = await actor.answer(StaffRolesList.displayed());
		return roles.find((role) => role.roleName === this.roleName);
	}

	override toString = () => `the staff role named "${this.roleName}"`;
}
