import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import type { Response } from 'playwright';

const membersForCurrentEndUserOperationName = 'AccountsCommunityListContainerMembersForCurrentEndUser';

type MembersForCurrentEndUserPayload = {
	data?: {
		membersForCurrentEndUser?: Array<{
			community?: { id: string } | null;
		}>;
	};
};

const hasGraphqlOperation = (operationName: string) => (response: Response) => response.url().includes('/api/graphql') && response.request().method() === 'POST' && (response.request().postData()?.includes(operationName) ?? false);

export class HasNoMemberForCommunity extends Question<Promise<boolean>> {
	static inCommunity(communityId: string): HasNoMemberForCommunity {
		return new HasNoMemberForCommunity(communityId);
	}

	private constructor(private readonly communityId: string) {
		super(`whether the current end user has no member in community "${communityId}"`);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<boolean> {
		const { page } = BrowseTheWeb.withActor(actor);
		const membershipsResponse = page.waitForResponse(hasGraphqlOperation(membersForCurrentEndUserOperationName), { timeout: 15_000 });
		await page.goto('/community/accounts', { waitUntil: 'networkidle' });
		const membershipsPayload = (await (await membershipsResponse).json()) as MembersForCurrentEndUserPayload | MembersForCurrentEndUserPayload[];
		const payload = Array.isArray(membershipsPayload) ? membershipsPayload.find((item) => item.data?.membersForCurrentEndUser) : membershipsPayload;
		const members = payload?.data?.membersForCurrentEndUser;

		if (!members) {
			throw new Error('Unable to determine memberships for the current end user');
		}

		return !members.some((member) => member.community?.id === this.communityId);
	}
}
