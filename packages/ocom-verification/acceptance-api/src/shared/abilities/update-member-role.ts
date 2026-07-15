import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { Ability, type Actor } from '@serenity-js/core';
import { MEMBER_ROLE_UPDATE_MUTATION } from '../graphql/member-operations.ts';

interface UpdateMemberRoleDetails {
	memberId: string;
	roleId: string;
	communityId: string;
	principalMemberId: string;
}

type ExecuteWithRequestOptions = <TData extends Record<string, unknown> = Record<string, unknown>>(
	query: string,
	variables?: Record<string, unknown>,
	options?: { headers?: Record<string, string> },
) => Promise<{ data: TData; errors?: Array<{ message?: string }> }>;

export class UpdateMemberRole extends Ability {
	constructor(private readonly handler: (actor: Actor, details: UpdateMemberRoleDetails) => Promise<string>) {
		super();
	}

	static using(handler: (actor: Actor, details: UpdateMemberRoleDetails) => Promise<string>): UpdateMemberRole {
		return new UpdateMemberRole(handler);
	}

	async performAs(actor: Actor, details: UpdateMemberRoleDetails): Promise<string> {
		return await this.handler(actor, details);
	}
}

export function updateMemberRoleAbility(): UpdateMemberRole {
	return UpdateMemberRole.using(async (actor, details) => {
		const graphql = GraphQLClient.as(actor) as GraphQLClient & { execute: ExecuteWithRequestOptions };
		const response = await graphql.execute(
			MEMBER_ROLE_UPDATE_MUTATION,
			{ input: { memberId: details.memberId, roleId: details.roleId, reason: 'Role assignment verification' } },
			{ headers: { 'x-community-id': details.communityId, 'x-member-id': details.principalMemberId } },
		);
		const result = response.data?.['memberRoleUpdate'] as Record<string, unknown> | undefined;
		const status = result?.['status'] as Record<string, unknown> | undefined;
		if (status?.['success'] !== true) {
			throw new Error(String(status?.['errorMessage'] ?? response.errors?.map((error) => error.message).join('; ') ?? 'Failed to update member role'));
		}
		const member = result?.['member'] as Record<string, unknown> | undefined;
		const role = member?.['role'] as Record<string, unknown> | undefined;
		return String(role?.['roleName'] ?? '');
	});
}
