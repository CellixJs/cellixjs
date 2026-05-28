import { CommunityPage, type E2ECommunityPage } from '@ocom-verification/verification-shared/pages';
import { PlaywrightPageAdapter } from '@ocom-verification/verification-shared/pages/playwright';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { Response } from 'playwright';
import { BrowseTheWeb } from '../../../shared/abilities/browse-the-web.ts';
import type { CommunityE2ENotes } from '../abilities/community-types.ts';

const createCommunityOperationName = 'AccountsCommunityCreateContainerCommunityCreate';
const communityListOperationName = 'AccountsCommunityListContainerCommunitiesForCurrentEndUser';
const memberListOperationName = 'AccountsCommunityListContainerMembersForCurrentEndUser';

type CommunityCreateGraphqlPayload = {
	data?: {
		communityCreate?: {
			status?: {
				success?: boolean;
				errorMessage?: string | null;
			};
			community?: {
				name?: string | null;
			} | null;
		};
	};
	errors?: Array<{ message?: string }>;
};

type CommunityListGraphqlPayload = {
	data?: {
		communitiesForCurrentEndUser?: Array<{ name?: string | null }> | null;
		membersForCurrentEndUser?: unknown[] | null;
	};
	errors?: Array<{ message?: string }>;
};

type GraphqlPayload<TData> = {
	data?: TData;
	errors?: Array<{ message?: string }>;
};

const hasGraphqlOperation = (operationName: string) => (response: Response) => {
	if (!response.url().includes('/api/graphql') || response.request().method() !== 'POST') {
		return false;
	}

	return response.request().postData()?.includes(operationName) ?? false;
};

const selectGraphqlPayload = <TData>(payload: GraphqlPayload<TData> | Array<GraphqlPayload<TData>> | null, hasExpectedData: (data: TData | undefined) => boolean): GraphqlPayload<TData> | null => {
	if (!Array.isArray(payload)) {
		return payload;
	}

	return payload.find((item) => hasExpectedData(item.data)) ?? payload.find((item) => item.errors?.length) ?? null;
};

const graphqlErrors = (payload: { errors?: Array<{ message?: string }> } | null): string | undefined =>
	payload?.errors
		?.map((error) => error.message)
		.filter(Boolean)
		.join('; ');

/**
 * Creates a community through the browser UI.
 */
export const CreateCommunity = (name: string) =>
	Interaction.where(the`#actor creates community "${name}" via UI`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		await page.goto('/community/accounts/create-community', {
			waitUntil: 'networkidle',
		});

		const adapter = new PlaywrightPageAdapter(page);
		const communityPage: E2ECommunityPage = new CommunityPage(adapter);

		await communityPage.fillName(name);

		const createMutationResponse = page.waitForResponse(hasGraphqlOperation(createCommunityOperationName), { timeout: 15_000 }).catch(() => null);
		const communityListResponse = page.waitForResponse(hasGraphqlOperation(communityListOperationName), { timeout: 15_000 }).catch(() => null);
		const memberListResponse = page.waitForResponse(hasGraphqlOperation(memberListOperationName), { timeout: 15_000 }).catch(() => null);

		await communityPage.clickCreate();

		await communityPage.firstValidationError.waitFor({ state: 'visible', timeout: 750 }).catch(() => undefined);
		const validationError = await communityPage.firstValidationError.isVisible().catch(() => false);
		if (validationError) {
			const errorText = await communityPage.firstValidationError.textContent();
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityCreated', false), notes<CommunityE2ENotes>().set('errorMessage', errorText || 'Validation error'));
			return;
		}

		const mutationResponse = await createMutationResponse;
		if (!mutationResponse) {
			await communityPage.errorToast.waitFor({ state: 'visible', timeout: 1_000 }).catch(() => undefined);
			const hasErrorToast = await communityPage.errorToast.isVisible().catch(() => false);
			const errorText = hasErrorToast ? await communityPage.errorToast.textContent() : null;
			const message = errorText || `No ${createCommunityOperationName} GraphQL response was received`;
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityCreated', false), notes<CommunityE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		const payload = selectGraphqlPayload((await mutationResponse.json().catch(() => null)) as CommunityCreateGraphqlPayload | CommunityCreateGraphqlPayload[] | null, (data) => Boolean(data?.communityCreate));
		const graphqlError = graphqlErrors(payload);
		const mutationResult = payload?.data?.communityCreate;
		const mutationError = mutationResult?.status?.errorMessage ?? graphqlError;
		const createdName = mutationResult?.community?.name ?? null;

		if (!mutationResponse.ok || graphqlError || mutationResult?.status?.success !== true || (createdName !== null && createdName !== name)) {
			const message =
				mutationError ||
				(mutationResult?.status?.success !== true
					? `${createCommunityOperationName} did not report success: ${JSON.stringify(payload)}`
					: createdName !== name
						? `Expected created community name "${name}" but GraphQL returned "${createdName ?? 'null'}"`
						: `Community create GraphQL request failed with HTTP ${mutationResponse.status()}`);
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityCreated', false), notes<CommunityE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		const listResponse = await communityListResponse;
		const listPayload = listResponse
			? selectGraphqlPayload((await listResponse.json().catch(() => null)) as CommunityListGraphqlPayload | CommunityListGraphqlPayload[] | null, (data) => data?.communitiesForCurrentEndUser !== undefined)
			: null;
		const listGraphqlError = graphqlErrors(listPayload);
		const listContainsCreatedCommunity = listPayload?.data?.communitiesForCurrentEndUser?.some((community) => community.name === name) ?? false;
		if (!listResponse?.ok() || listGraphqlError || !listContainsCreatedCommunity) {
			const message = listGraphqlError || `Expected "${name}" in ${communityListOperationName} response after creation`;
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityCreated', false), notes<CommunityE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		const membersResponse = await memberListResponse;
		const membersPayload = membersResponse
			? selectGraphqlPayload((await membersResponse.json().catch(() => null)) as CommunityListGraphqlPayload | CommunityListGraphqlPayload[] | null, (data) => data?.membersForCurrentEndUser !== undefined)
			: null;
		const membersGraphqlError = graphqlErrors(membersPayload);
		if (!membersResponse?.ok() || membersGraphqlError) {
			const message = membersGraphqlError || `${memberListOperationName} did not complete successfully after creation`;
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityCreated', false), notes<CommunityE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		await page.getByRole('cell', { name, exact: true }).first().waitFor({ state: 'visible', timeout: 5_000 });
		await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityName', name), notes<CommunityE2ENotes>().set('communityCreated', true), notes<CommunityE2ENotes>().set('errorMessage', null));
	});
