import { notes, Task } from '@serenity-js/core';
import { MEMBER_CREATE_MUTATION } from '../../../shared/graphql/member-operations.ts';
import { ExecuteGraphQL } from '../../../shared/interactions/execute-graphql.ts';
import { LastGraphQLResponse } from '../../../shared/questions/last-graphql-response.ts';
import type { MemberNotes } from '../notes/member-notes.ts';

interface CreateMemberDetails {
	memberName: string;
	communityId: string;
	principalMemberId: string;
}

export const CreateMember = (details: CreateMemberDetails): Task =>
	Task.where(
		`#actor creates a member named "${details.memberName}"`,
		ExecuteGraphQL.operation(
			MEMBER_CREATE_MUTATION,
			{ input: { memberName: details.memberName, communityId: details.communityId } },
			{ headers: { 'x-community-id': details.communityId, 'x-member-id': details.principalMemberId } },
		),
		notes<MemberNotes>().set('lastMemberId', LastGraphQLResponse.field<string>('memberCreate.member.id')),
		notes<MemberNotes>().set('lastMemberCommunityId', details.communityId),
		notes<MemberNotes>().set('lastMemberName', LastGraphQLResponse.field<string>('memberCreate.member.memberName')),
	);
