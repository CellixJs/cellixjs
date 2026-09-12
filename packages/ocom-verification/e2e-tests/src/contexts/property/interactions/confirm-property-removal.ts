import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { graphqlErrors, hasGraphqlOperation, selectGraphqlPayload } from '../../../shared/support/graphql-response.ts';
import { browserPageOf, propertyFormOn, waitUntil } from '../abilities/admin-portal-page.ts';
import type { PropertyE2ENotes } from '../notes/property-notes.ts';

const deletePropertyOperationName = 'AdminPropertiesDetailContainerPropertyDelete';

type PropertyDeleteGraphqlPayload = {
	data?: {
		propertyDelete?: {
			status?: {
				success?: boolean;
				errorMessage?: string | null;
			};
		};
	};
	errors?: Array<{ message?: string }>;
};

/**
 * Low-level interaction that removes the property currently on screen through
 * the confirmation modal and records the outcome in actor notes.
 */
export const ConfirmPropertyRemoval = () =>
	Interaction.where(the`#actor confirms the property removal`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = browserPageOf(actor);
		const formPage = propertyFormOn(page);

		await formPage.clickRemoveProperty();
		await waitUntil(() => formPage.removeConfirmationTitle.isVisible(), 'Timed out waiting for the remove property confirmation modal');

		const deleteMutationResponse = page.waitForResponse(hasGraphqlOperation(deletePropertyOperationName), { timeout: 15_000 }).catch(() => null);
		await formPage.clickConfirmRemove();

		const mutationResponse = await deleteMutationResponse;
		if (!mutationResponse) {
			const message = `Timed out waiting for the ${deletePropertyOperationName} request`;
			await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'ERROR'), notes<PropertyE2ENotes>().set('lastPropertyError', message));
			throw new Error(message);
		}

		const payload = selectGraphqlPayload((await mutationResponse.json().catch(() => null)) as PropertyDeleteGraphqlPayload | PropertyDeleteGraphqlPayload[] | null, (data) => Boolean(data?.propertyDelete));
		const graphqlError = graphqlErrors(payload);
		const mutationResult = payload?.data?.propertyDelete;
		if (graphqlError || mutationResult?.status?.success !== true) {
			const message = mutationResult?.status?.errorMessage ?? graphqlError ?? `${deletePropertyOperationName} did not report success: ${JSON.stringify(payload)}`;
			await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'ERROR'), notes<PropertyE2ENotes>().set('lastPropertyError', message));
			return;
		}

		// On success the app navigates back to the properties list.
		await page.waitForURL((url) => /\/properties\/?$/.test(url.pathname), { timeout: 15_000 });
		await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'SUCCESS'), notes<PropertyE2ENotes>().set('lastPropertyError', null));
	});
