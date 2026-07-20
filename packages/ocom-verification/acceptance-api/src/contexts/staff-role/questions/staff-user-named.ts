import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { STAFF_USERS_QUERY, type StaffUserResult } from '../../../shared/graphql/staff-role-operations.ts';

/**
 * Question that finds a staff user by display name through the API.
 * Fails with a diagnostic error when the staff user does not exist.
 */
export class StaffUserNamed extends Question<Promise<StaffUserResult>> {
	static called(displayName: string): StaffUserNamed {
		return new StaffUserNamed(displayName);
	}

	private constructor(private readonly displayName: string) {
		super(`the staff user "${displayName}"`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<StaffUserResult> {
		const response = await GraphQLClient.as(actor as unknown as Actor).execute(STAFF_USERS_QUERY);
		const staffUsers = response.data['staffUsers'] as StaffUserResult[];
		const staffUser = staffUsers.find((user) => user.displayName === this.displayName);
		if (!staffUser) {
			throw new Error(`Staff user "${this.displayName}" was not found`);
		}
		return staffUser;
	}

	override toString = () => `the staff user "${this.displayName}"`;
}
