import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { Response } from 'playwright';
import { communityPortalPageOf } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { CommunityId } from '../questions/community-id.ts';

const membersForCurrentEndUserOperationName = 'AccountsCommunityListContainerMembersForCurrentEndUser';

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

const hasGraphqlOperation = (operationName: string) => (response: Response) => response.url().includes('/api/graphql') && response.request().method() === 'POST' && (response.request().postData()?.includes(operationName) ?? false);

const selectPayload = <TData>(payload: GraphqlPayload<TData> | GraphqlPayload<TData>[] | null, hasExpectedData: (data: TData | undefined) => boolean): GraphqlPayload<TData> | null => {
	if (!Array.isArray(payload)) {
		return payload;
	}

	return payload.find((item) => hasExpectedData(item.data)) ?? payload.find((item) => item.errors?.length) ?? null;
};

export const ResolveCommunityAdministratorMembership = (actor: Actor, communityName: string) =>
	Interaction.where(the`#actor resolves administrator membership for "${communityName}"`, async () => {
		const page = communityPortalPageOf(actor);
		const communityId = await actor.answer(CommunityId(communityName));

		const membershipsResponse = page.waitForResponse(hasGraphqlOperation(membersForCurrentEndUserOperationName), { timeout: 15_000 });
		await page.goto('/community/accounts', { waitUntil: 'networkidle' });
		const membershipsPayload = selectPayload((await (await membershipsResponse).json()) as MembersForCurrentEndUserPayload | MembersForCurrentEndUserPayload[], (data) => Boolean(data?.membersForCurrentEndUser));
		const routeMemberId = membershipsPayload?.data?.membersForCurrentEndUser?.find((member) => member.isAdmin && member.community?.id === communityId)?.id;
		if (!routeMemberId) {
			throw new Error(`No administrator membership found for community "${communityName}"`);
		}

		await actor.attemptsTo(notes<MemberE2ENotes>().set('routeMemberId', routeMemberId));
	});
