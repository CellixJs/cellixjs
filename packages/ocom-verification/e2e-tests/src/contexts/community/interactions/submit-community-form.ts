import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { CommunityPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { E2ECommunityPage } from '../../../shared/page-contracts.ts';
import { type GraphqlPayload, graphqlErrors, hasGraphqlOperation, selectGraphqlPayload } from '../../../shared/support/graphql-response.ts';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';

const createCommunityOperationName = 'AccountsCommunityCreateContainerCommunityCreate';

type CommunityCreateData = {
	communityCreate?: {
		status?: {
			success?: boolean;
			errorMessage?: string | null;
		};
		community?: {
			id?: string | null;
			name?: string | null;
		} | null;
	};
};

/**
 * Low-level interaction that submits the create-community form, waits for the
 * create mutation (or a client-side validation error), and records the outcome
 * in actor notes.
 */
export const SubmitCommunityForm = (name: string) =>
	Interaction.where(the`#actor submits the community form for "${name}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);
		const communityPage: E2ECommunityPage = new CommunityPage(new PlaywrightPageAdapter(page));

		const createMutationResponse = page.waitForResponse(hasGraphqlOperation(createCommunityOperationName), { timeout: 15_000 }).catch(() => null);
		await communityPage.clickCreate();

		await communityPage.firstValidationError.waitFor({ state: 'visible', timeout: 750 }).catch(() => undefined);
		const validationError = await communityPage.firstValidationError.isVisible().catch(() => false);
		if (validationError) {
			const errorText = await communityPage.firstValidationError.textContent();
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityId', null), notes<CommunityE2ENotes>().set('communityCreated', false), notes<CommunityE2ENotes>().set('errorMessage', errorText || 'Validation error'));
			return;
		}

		const mutationResponse = await createMutationResponse;
		if (mutationResponse) {
			const payload = selectGraphqlPayload((await mutationResponse.json().catch(() => null)) as GraphqlPayload<CommunityCreateData> | Array<GraphqlPayload<CommunityCreateData>> | null, (data) => Boolean(data?.communityCreate));
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
				await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityId', null), notes<CommunityE2ENotes>().set('communityCreated', false), notes<CommunityE2ENotes>().set('errorMessage', message));
				throw new Error(message);
			}

			const communityId = mutationResult?.community?.id ?? null;
			if (!communityId) {
				const message = `${createCommunityOperationName} succeeded but returned no community id`;
				await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityId', null), notes<CommunityE2ENotes>().set('communityCreated', false), notes<CommunityE2ENotes>().set('errorMessage', message));
				throw new Error(message);
			}

			await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityId', communityId));
		}

		await page.waitForURL(/\/community\/accounts(?:\/)?(?:\?.*)?$/, { timeout: 15_000 }).catch(() => undefined);
		await communityPage.errorToast.waitFor({ state: 'visible', timeout: 1_000 }).catch(() => undefined);
		const hasErrorToast = await communityPage.errorToast.isVisible().catch(() => false);
		if (hasErrorToast) {
			const errorText = await communityPage.errorToast.textContent();
			const message = errorText || 'Community creation failed';
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityId', null), notes<CommunityE2ENotes>().set('communityCreated', false), notes<CommunityE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		await page.getByRole('cell', { name, exact: true }).first().waitFor({ state: 'visible', timeout: 15_000 });
		await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityName', name), notes<CommunityE2ENotes>().set('communityCreated', true), notes<CommunityE2ENotes>().set('errorMessage', null));
	});
