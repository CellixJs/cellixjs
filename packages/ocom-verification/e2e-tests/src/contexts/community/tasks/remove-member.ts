import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { MemberListPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { Response } from 'playwright';
import { buildUrl, getHostnames } from '../../../shared/environment/test-environment.ts';
import type { E2EMemberListPage } from '../../../shared/page-contracts.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

const membersOperationName = 'AdminMemberListContainerMembers';
const removeMemberOperationName = 'AdminMemberListContainerRemoveMember';
const membersForCurrentEndUserOperationName = 'AccountsCommunityListContainerMembersForCurrentEndUser';
const apiUrl = buildUrl(getHostnames().api, '/api/graphql');

const removeMemberMutation = `
	mutation RemoveMember($input: RemoveMemberInput!) {
		removeMember(input: $input) {
			status {
				success
				errorMessage
			}
		}
	}
`;

type RemoveMemberPayload = {
	data?: { removeMember?: { status?: { success?: boolean; errorMessage?: string | null } } };
	errors?: Array<{ message?: string }>;
};

type MembersForCurrentEndUserPayload = {
	data?: {
		membersForCurrentEndUser?: Array<{
			id: string;
			isAdmin?: boolean | null;
			community?: { id: string } | null;
		}>;
	};
	errors?: Array<{ message?: string }>;
};

const hasGraphqlOperation = (operationName: string) => (response: Response) => response.url().includes('/api/graphql') && response.request().method() === 'POST' && (response.request().postData()?.includes(operationName) ?? false);

const selectPayload = (payload: RemoveMemberPayload | RemoveMemberPayload[] | null): RemoveMemberPayload | null => {
	if (!Array.isArray(payload)) {
		return payload;
	}
	return payload.find((item) => item.data?.removeMember) ?? payload.find((item) => item.errors?.length) ?? null;
};

export const RemoveMember = (communityName: string, memberName: string) =>
	Interaction.where(the`#actor removes member "${memberName}" from "${communityName}" via UI`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		const communityIds = await actor.answer(notes<MemberE2ENotes>().get('communityIdsByName'));
		const communityId = communityIds[communityName];
		if (!communityId) {
			throw new Error(`Missing community state for removal from "${communityName}"`);
		}

		// get adminMemberId; if not found still attempt to remove member and server should reject request
		const membershipsResponse = page.waitForResponse(hasGraphqlOperation(membersForCurrentEndUserOperationName), { timeout: 15_000 });
		await page.goto('/community/accounts', { waitUntil: 'networkidle' });
		const membershipsPayload = (await (await membershipsResponse).json()) as MembersForCurrentEndUserPayload | MembersForCurrentEndUserPayload[];
		const selectedMembershipsPayload = Array.isArray(membershipsPayload) ? membershipsPayload.find((item) => item.data?.membersForCurrentEndUser) : membershipsPayload;
		const adminMemberId = selectedMembershipsPayload?.data?.membersForCurrentEndUser?.find((member) => member.isAdmin && member.community?.id === communityId)?.id;
		if (!adminMemberId) {
			const memberId = await actor.answer(notes<MemberE2ENotes>().get('lastMemberId'));
			const accessToken = await page.evaluate(() => {
				for (const storage of [sessionStorage, localStorage]) {
					for (let index = 0; index < storage.length; index += 1) {
						const key = storage.key(index);
						if (!key?.startsWith('oidc.user:')) continue;
						const value = storage.getItem(key);
						if (!value) continue;
						const user = JSON.parse(value) as { access_token?: unknown };
						if (typeof user.access_token === 'string') return user.access_token;
					}
				}
				return null;
			});
			if (!memberId || !accessToken) {
				throw new Error(`Missing authenticated removal request state for "${communityName}"`);
			}

			const response = await page.request.post(apiUrl, {
				data: { query: removeMemberMutation, variables: { input: { memberId } } },
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'x-community-id': communityId,
				},
			});
			const payload = selectPayload((await response.json().catch(() => null)) as RemoveMemberPayload | RemoveMemberPayload[] | null);
			const result = payload?.data?.removeMember;
			if (response.ok() && !payload?.errors?.length && result?.status?.success === true) {
				await actor.attemptsTo(notes<MemberE2ENotes>().set('memberRemoved', true), notes<MemberE2ENotes>().set('errorMessage', null));
				throw new Error('Expected the server to reject member removal');
			}
			const message =
				result?.status?.errorMessage ??
				payload?.errors
					?.map((error) => error.message)
					.filter(Boolean)
					.join('; ') ??
				`Member removal request failed with HTTP ${response.status()}`;
			await actor.attemptsTo(notes<MemberE2ENotes>().set('memberRemoved', false), notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		const membersResponse = page.waitForResponse(hasGraphqlOperation(membersOperationName), { timeout: 5_000 }).catch(() => null);
		await page.goto(`/community/${encodeURIComponent(communityId)}/admin/${encodeURIComponent(adminMemberId)}/members`, { waitUntil: 'networkidle' });
		if (!(await membersResponse)) {
			const message = 'User is not authorized for member management';
			await actor.attemptsTo(notes<MemberE2ENotes>().set('memberRemoved', false), notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		const memberListPage: E2EMemberListPage = new MemberListPage(new PlaywrightPageAdapter(page));
		const memberVisible = await memberListPage
			.memberName(memberName)
			.waitFor({ state: 'visible', timeout: 3_000 })
			.then(
				() => true,
				() => false,
			);
		if (!memberVisible) {
			const message = 'User is not authorized for member management';
			await actor.attemptsTo(notes<MemberE2ENotes>().set('memberRemoved', false), notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}
		const mutationResponse = page.waitForResponse(hasGraphqlOperation(removeMemberOperationName), { timeout: 15_000 });
		await memberListPage.clickRemoveMember(memberName);

		const response = await mutationResponse;
		const payload = selectPayload((await response.json().catch(() => null)) as RemoveMemberPayload | RemoveMemberPayload[] | null);
		const result = payload?.data?.removeMember;
		if (!response.ok() || payload?.errors?.length || result?.status?.success !== true) {
			const message =
				result?.status?.errorMessage ??
				payload?.errors
					?.map((error) => error.message)
					.filter(Boolean)
					.join('; ') ??
				'Member removal failed';
			await actor.attemptsTo(notes<MemberE2ENotes>().set('memberRemoved', false), notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		await memberListPage.memberName(memberName).waitFor({ state: 'hidden', timeout: 15_000 });
		await actor.attemptsTo(notes<MemberE2ENotes>().set('memberRemoved', true), notes<MemberE2ENotes>().set('errorMessage', null));
	});
