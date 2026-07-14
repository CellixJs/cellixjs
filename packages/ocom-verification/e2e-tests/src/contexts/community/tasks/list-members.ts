import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { Response } from 'playwright';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

const membersForCurrentEndUserOperationName = 'AccountsCommunityListContainerMembersForCurrentEndUser';
const membersOperationName = 'AdminMemberListContainerMembers';

type GraphqlPayload<TData> = {
	data?: TData;
	errors?: Array<{ message?: string }>;
};

type MembersForCurrentEndUserPayload = GraphqlPayload<{
	membersForCurrentEndUser?: Array<{
		id: string;
		isAdmin?: boolean | null;
		community?: { id: string } | null;
	}>;
}>;

type MembersPayload = GraphqlPayload<{
	membersByCommunityId?: Array<{ id: string; memberName?: string | null }>;
}>;

const hasGraphqlOperation = (operationName: string) => (response: Response) => response.url().includes('/api/graphql') && response.request().method() === 'POST' && (response.request().postData()?.includes(operationName) ?? false);

const selectPayload = <TData>(payload: GraphqlPayload<TData> | GraphqlPayload<TData>[] | null, hasExpectedData: (data: TData | undefined) => boolean): GraphqlPayload<TData> | null => {
	if (!Array.isArray(payload)) {
		return payload;
	}

	return payload.find((item) => hasExpectedData(item.data)) ?? payload.find((item) => item.errors?.length) ?? null;
};

export const ListMembers = (communityName: string) =>
	Interaction.where(the`#actor lists members in "${communityName}" via UI`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		const communityIdsByName = await actor.answer(notes<MemberE2ENotes>().get('communityIdsByName'));
		const communityId = communityIdsByName[communityName];
		if (!communityId) {
			throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
		}

		const membershipsResponse = page.waitForResponse(hasGraphqlOperation(membersForCurrentEndUserOperationName), { timeout: 15_000 });
		await page.goto('/community/accounts', { waitUntil: 'networkidle' });
		const membershipsPayload = selectPayload((await (await membershipsResponse).json()) as MembersForCurrentEndUserPayload | MembersForCurrentEndUserPayload[], (data) => Boolean(data?.membersForCurrentEndUser));
		const principalMemberId = membershipsPayload?.data?.membersForCurrentEndUser?.find((member) => member.isAdmin && member.community?.id === communityId)?.id;
		if (!principalMemberId) {
			throw new Error(`No administrator membership found for community "${communityName}"`);
		}

		const membersResponse = page.waitForResponse(hasGraphqlOperation(membersOperationName), { timeout: 15_000 });
		await page.goto(`/community/${encodeURIComponent(communityId)}/admin/${encodeURIComponent(principalMemberId)}/members`, { waitUntil: 'networkidle' });
		const response = await membersResponse;
		const payload = selectPayload((await response.json().catch(() => null)) as MembersPayload | MembersPayload[] | null, (data) => Array.isArray(data?.membersByCommunityId));
		if (!response.ok() || payload?.errors?.length || !Array.isArray(payload?.data?.membersByCommunityId)) {
			const message =
				payload?.errors
					?.map((error) => error.message)
					.filter(Boolean)
					.join('; ') || `Failed to list members in "${communityName}"`;
			throw new Error(message);
		}

		await actor.attemptsTo(notes<MemberE2ENotes>().set('principalMemberId', principalMemberId));
	});
