import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { type GraphqlPayload, graphqlErrors, hasGraphqlOperation, selectGraphqlPayload } from '../../../shared/support/graphql-response.ts';
import { communityPortalPageOf, settingsPageOn } from '../abilities/community-portal-page.ts';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';

const updateCommunityOperationName = 'AdminSettingsGeneralContainerCommunityUpdateSettings';

type CommunityUpdateSettingsData = {
	communityUpdateSettings?: {
		status?: {
			success?: boolean;
			errorMessage?: string | null;
		};
		community?: {
			id?: string | null;
			name?: string | null;
			domain?: string | null;
			whiteLabelDomain?: string | null;
			handle?: string | null;
		} | null;
	};
};

/**
 * Low-level interaction that submits the community settings form, waits for the
 * update mutation (or a client-side validation error), and records the outcome
 * in actor notes.
 */
export const SubmitCommunitySettingsForm = () =>
	Interaction.where(the`#actor submits the community settings form`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await communityPortalPageOf(actor);
		const settingsPage = settingsPageOn(page);

		const updateMutationResponse = page.waitForResponse(hasGraphqlOperation(updateCommunityOperationName), { timeout: 15_000 }).catch(() => null);
		await settingsPage.clickSave();

		await settingsPage.firstValidationError.waitFor({ state: 'visible', timeout: 750 }).catch(() => undefined);
		const hasValidationError = await settingsPage.firstValidationError.isVisible().catch(() => false);
		if (hasValidationError) {
			const errorText = await settingsPage.firstValidationError.textContent();
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('settingsSaved', false), notes<CommunityE2ENotes>().set('errorMessage', errorText || 'Validation error'));
			return;
		}

		const mutationResponse = await updateMutationResponse;
		if (!mutationResponse) {
			const message = `Timed out waiting for the ${updateCommunityOperationName} mutation`;
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('settingsSaved', false), notes<CommunityE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		const payload = selectGraphqlPayload((await mutationResponse.json().catch(() => null)) as GraphqlPayload<CommunityUpdateSettingsData> | Array<GraphqlPayload<CommunityUpdateSettingsData>> | null, (data) =>
			Boolean(data?.communityUpdateSettings),
		);
		const graphqlError = graphqlErrors(payload);
		const mutationResult = payload?.data?.communityUpdateSettings;

		if (graphqlError || mutationResult?.status?.success !== true) {
			const message = mutationResult?.status?.errorMessage ?? graphqlError ?? `${updateCommunityOperationName} did not report success: ${JSON.stringify(payload)}`;
			await actor.attemptsTo(notes<CommunityE2ENotes>().set('settingsSaved', false), notes<CommunityE2ENotes>().set('errorMessage', message));
			return;
		}

		const community = mutationResult.community;
		await actor.attemptsTo(
			notes<CommunityE2ENotes>().set('settingsSaved', true),
			notes<CommunityE2ENotes>().set('errorMessage', null),
			notes<CommunityE2ENotes>().set('communityId', community?.id ?? null),
			notes<CommunityE2ENotes>().set('communityName', community?.name ?? ''),
			notes<CommunityE2ENotes>().set('savedWhiteLabelDomain', community?.whiteLabelDomain ?? ''),
			notes<CommunityE2ENotes>().set('savedDomain', community?.domain ?? ''),
			notes<CommunityE2ENotes>().set('savedHandle', community?.handle ?? ''),
		);
	});
