import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { MEMBER_CREATE_MUTATION } from '../graphql/member-operations.ts';

/** Member details accepted by API verification flows. */
export interface CreateMemberDetails {
	memberName: string;
	communityId: string;
	principalMemberId: string;
}

/** Result returned by the API member creation flow. */
interface CreateMemberResult {
	id?: string;
	memberName: string;
}

/** Handler that performs member creation for an API actor. */
type CreateMemberHandler = (actor: Actor, details: CreateMemberDetails) => Promise<CreateMemberResult>;

type ExecuteWithRequestOptions = <TData extends Record<string, unknown> = Record<string, unknown>>(
	query: string,
	variables?: Record<string, unknown>,
	options?: { headers?: Record<string, string> },
) => Promise<{ data: TData; errors?: Array<{ message?: string }> }>;

/**
 * Serenity ability that creates members through the API verification server.
 */
export class CreateMember extends Ability {
	constructor(private readonly handler: CreateMemberHandler) {
		super();
	}

	static using(handler: CreateMemberHandler): CreateMember {
		return new CreateMember(handler);
	}

	async performAs(actor: Actor, details: CreateMemberDetails): Promise<CreateMemberResult> {
		return await this.handler(actor, details);
	}
}

export function createMemberAbility(): CreateMember {
	return CreateMember.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor) as GraphQLClient & { execute: ExecuteWithRequestOptions };
		if (!details.communityId) {
			throw new Error('communityId is required to create a member');
		}
		if (!details.principalMemberId) {
			throw new Error('principalMemberId is required to create a member');
		}

		const response = await graphql.execute(
			MEMBER_CREATE_MUTATION,
			{
				input: {
					memberName: details.memberName,
					communityId: details.communityId,
				},
			},
			{
				headers: {
					'x-community-id': details.communityId,
					'x-member-id': details.principalMemberId,
				},
			},
		);

		const mutationResult = response.data?.['memberCreate'] as Record<string, unknown> | undefined;
		const status = mutationResult?.['status'] as Record<string, unknown> | undefined;
		const member = mutationResult?.['member'] as Record<string, unknown> | undefined;

		if (status?.['success'] !== true) {
			throw new Error(String(status?.['errorMessage'] ?? 'Failed to create member'));
		}

		const memberId = String(member?.['id'] ?? '');
		const createdName = String(member?.['memberName'] ?? '');
		if (!memberId) {
			throw new Error('API memberCreate returned a member without an id');
		}

		return {
			id: memberId,
			memberName: createdName || details.memberName,
		};
	});
}
