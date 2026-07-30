import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { STAFF_ROLES_QUERY, type StaffRoleResult } from '../../../shared/graphql/staff-role-operations.ts';

/**
 * Question that reads the staff roles currently visible to the actor from the API.
 */
export class StaffRolesList extends Question<Promise<StaffRoleResult[]>> {
	constructor() {
		super('the staff roles list');
	}

	static displayed(): StaffRolesList {
		return new StaffRolesList();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<StaffRoleResult[]> {
		const response = await GraphQLClient.as(actor as unknown as Actor).execute(STAFF_ROLES_QUERY);
		return response.data['staffRoles'] as StaffRoleResult[];
	}

	override toString = () => 'the staff roles list';
}
