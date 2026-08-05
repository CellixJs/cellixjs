import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { MEMBER_CREATE_ACCOUNT_MUTATION } from '../graphql/member-operations.ts';

interface AssignMemberAccountDetails {
	communityId: string;
	principalMemberId: string;
	memberId: string;
	endUserId: string;
}

type AssignMemberAccountHandler = (actor: Actor, details: AssignMemberAccountDetails) => Promise<void>;

type ExecuteWithRequestOptions = <TData extends Record<string, unknown> = Record<string, unknown>>(
	query: string,
	variables?: Record<string, unknown>,
	options?: { headers?: Record<string, string> },
) => Promise<{ data: TData; errors?: Array<{ message?: string }> }>;

export class AssignMemberAccount extends Ability {
	constructor(private readonly handler: AssignMemberAccountHandler) {
		super();
	}

	static using(handler: AssignMemberAccountHandler): AssignMemberAccount {
		return new AssignMemberAccount(handler);
	}

	async performAs(actor: Actor, details: AssignMemberAccountDetails): Promise<void> {
		await this.handler(actor, details);
	}
}

export function assignMemberAccountAbility(): AssignMemberAccount {
	return AssignMemberAccount.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor) as GraphQLClient & { execute: ExecuteWithRequestOptions };
		const response = await graphql.execute(
			MEMBER_CREATE_ACCOUNT_MUTATION,
			{ input: { memberId: details.memberId, endUserId: details.endUserId } },
			{ headers: { 'x-community-id': details.communityId, 'x-member-id': details.principalMemberId } },
		);
		const result = response.data?.['memberCreateAccount'] as Record<string, unknown> | undefined;
		const status = result?.['status'] as Record<string, unknown> | undefined;
		if (status?.['success'] !== true) {
			throw new Error(String(status?.['errorMessage'] ?? 'Failed to assign member account'));
		}
	});
}
