import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { MEMBER_CREATE_MUTATION, type MemberResult } from '../graphql/member-operations.ts';

interface CreateMemberDetails {
	communityId: string;
	memberName: string;
}

type CreateMemberHandler = (actor: Actor, details: CreateMemberDetails) => Promise<MemberResult>;

export class CreateMember extends Ability {
	constructor(private readonly handler: CreateMemberHandler) {
		super();
	}

	static using(handler: CreateMemberHandler): CreateMember {
		return new CreateMember(handler);
	}

	async performAs(actor: Actor, details: CreateMemberDetails): Promise<MemberResult> {
		return await this.handler(actor, details);
	}
}

export function createMemberAbility(): CreateMember {
	return CreateMember.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor);
		const response = await graphql.execute(MEMBER_CREATE_MUTATION, {
			input: {
				communityId: details.communityId,
				memberName: details.memberName,
			},
		});
		const payload = response.data['memberCreate'] as { status?: { success?: boolean; errorMessage?: string | null }; member?: MemberResult | null } | undefined;
		if (payload?.status?.success !== true) {
			throw new Error(String(payload?.status?.errorMessage ?? 'Failed to create member'));
		}
		const member = payload.member;
		if (!member?.id) {
			throw new Error('memberCreate reported success but returned no member id');
		}
		return member;
	});
}
