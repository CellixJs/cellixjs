import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { MEMBERS_BY_COMMUNITY_QUERY } from '../graphql/member-operations.ts';

interface ListMembersDetails {
	communityId: string;
	principalMemberId: string;
}

interface ListedMember {
	memberName: string;
}

type ListMembersHandler = (actor: Actor, details: ListMembersDetails) => Promise<ListedMember[]>;

export class ListMembers extends Ability {
	constructor(private readonly handler: ListMembersHandler) {
		super();
	}

	static using(handler: ListMembersHandler): ListMembers {
		return new ListMembers(handler);
	}

	async performAs(actor: Actor, details: ListMembersDetails): Promise<ListedMember[]> {
		return await this.handler(actor, details);
	}
}

export function listMembersAbility(): ListMembers {
	return ListMembers.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(
			MEMBERS_BY_COMMUNITY_QUERY,
			{ communityId: details.communityId },
			{
				headers: {
					'x-community-id': details.communityId,
					'x-member-id': details.principalMemberId,
				},
			},
		);

		if (response.errors?.length) {
			throw new Error(
				response.errors
					.map((error) => error.message)
					.filter(Boolean)
					.join('; ') || 'Failed to list members',
			);
		}

		const members = response.data?.['membersByCommunityId'];
		if (!Array.isArray(members)) {
			throw new Error('API membersByCommunityId did not return a member list');
		}

		return members.map((member) => ({ memberName: String((member as Record<string, unknown>)['memberName'] ?? '') }));
	});
}
