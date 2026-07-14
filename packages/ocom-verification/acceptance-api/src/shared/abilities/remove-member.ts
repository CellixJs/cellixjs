import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { REMOVE_MEMBER_MUTATION } from '../graphql/member-operations.ts';

interface RemoveMemberDetails {
	memberId: string;
	communityId: string;
	principalMemberId: string;
	authorizationToken?: string;
}

type ExecuteWithRequestOptions = <TData extends Record<string, unknown> = Record<string, unknown>>(
	query: string,
	variables?: Record<string, unknown>,
	options?: { headers?: Record<string, string> },
) => Promise<{ data: TData; errors?: Array<{ message?: string }> }>;

export class RemoveMember extends Ability {
	constructor(private readonly handler: (actor: Actor, details: RemoveMemberDetails) => Promise<void>) {
		super();
	}

	static using(handler: (actor: Actor, details: RemoveMemberDetails) => Promise<void>): RemoveMember {
		return new RemoveMember(handler);
	}

	async performAs(actor: Actor, details: RemoveMemberDetails): Promise<void> {
		await this.handler(actor, details);
	}
}

export function removeMemberAbility(): RemoveMember {
	return RemoveMember.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor) as GraphQLClient & { execute: ExecuteWithRequestOptions };
		const response = await graphql.execute(
			REMOVE_MEMBER_MUTATION,
			{ input: { memberId: details.memberId } },
			{
				headers: {
					'x-community-id': details.communityId,
					'x-member-id': details.principalMemberId,
					...(details.authorizationToken ? { Authorization: `Bearer ${details.authorizationToken}` } : {}),
				},
			},
		);
		const result = response.data?.['removeMember'] as Record<string, unknown> | undefined;
		const status = result?.['status'] as Record<string, unknown> | undefined;
		if (status?.['success'] !== true) {
			throw new Error(String(status?.['errorMessage'] ?? response.errors?.map((error) => error.message).join('; ') ?? 'Failed to remove member'));
		}
	});
}
