import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import { STAFF_ROLE_BY_ID_QUERY, type StaffRoleResult } from '../../../shared/graphql/staff-role-operations.ts';
import type { StaffRoleNotes } from '../notes/staff-role-notes.ts';

type ViewedField = 'roleName' | 'enterpriseAppRole';

const noteKeyByField: Record<ViewedField, keyof StaffRoleNotes> = {
	roleName: 'viewedStaffRoleName',
	enterpriseAppRole: 'viewedStaffRoleEnterpriseAppRole',
};

/**
 * Question that reads a field of the staff role the actor last viewed.
 * Prefers a live API read by the viewed staff role id, falling back to actor notes.
 */
export class ViewedStaffRole extends Question<Promise<string>> {
	static roleName(): ViewedStaffRole {
		return new ViewedStaffRole('roleName');
	}

	static enterpriseAppRole(): ViewedStaffRole {
		return new ViewedStaffRole('enterpriseAppRole');
	}

	private constructor(private readonly field: ViewedField) {
		super(`the viewed staff role ${field}`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
		const viewedRoleId = await this.readNote(actor, 'viewedStaffRoleId');
		const apiValue = await this.readFieldFromApi(actor, viewedRoleId);
		if (apiValue) {
			return apiValue;
		}

		const notedValue = await this.readNote(actor, noteKeyByField[this.field]);
		if (!notedValue) {
			throw new Error(`No viewed staff role ${this.field} found in the system or actor notes. Did the actor view a staff role first?`);
		}
		return notedValue;
	}

	override toString = () => `the viewed staff role ${this.field}`;

	private async readFieldFromApi(actor: AnswersQuestions & UsesAbilities, staffRoleId?: string): Promise<string | undefined> {
		if (!staffRoleId) {
			return undefined;
		}
		try {
			const response = await GraphQLClient.as(actor as unknown as Actor).execute(STAFF_ROLE_BY_ID_QUERY, { id: staffRoleId });
			const staffRole = response.data['staffRoleById'] as StaffRoleResult | null;
			return staffRole?.[this.field] ? String(staffRole[this.field]) : undefined;
		} catch {
			return undefined;
		}
	}

	private async readNote(actor: AnswersQuestions & UsesAbilities, key: keyof StaffRoleNotes): Promise<string | undefined> {
		try {
			return await actor.answer(notes<Record<typeof key, string>>().get(key));
		} catch {
			return undefined;
		}
	}
}
