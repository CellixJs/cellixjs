import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { graphqlErrors, hasGraphqlOperation, selectGraphqlPayload } from '../../../shared/support/graphql-response.ts';
import { browserPageOf, propertyFormOn, recordPropertyId } from '../abilities/admin-portal-page.ts';
import type { PropertyE2ENotes } from '../notes/property-notes.ts';

const createPropertyOperationName = 'AdminPropertiesCreateContainerPropertyCreate';

type PropertyCreateGraphqlPayload = {
	data?: {
		propertyCreate?: {
			status?: {
				success?: boolean;
				errorMessage?: string | null;
			};
			property?: {
				id?: string | null;
				propertyName?: string | null;
			} | null;
		};
	};
	errors?: Array<{ message?: string }>;
};

/**
 * Low-level interaction that submits the create property form currently on
 * screen and records the outcome in actor notes. Unlike `SubmitPropertyCreate`
 * it does NOT wait for a detail-page navigation: the full-field create flow is
 * expected to land back on the properties list, which the corresponding Then
 * step asserts separately.
 */
export const SubmitPropertyCreateExpectingList = (propertyName: string) =>
	Interaction.where(the`#actor submits the full create property form`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = browserPageOf(actor);
		const formPage = propertyFormOn(page);

		const createMutationResponse = page.waitForResponse(hasGraphqlOperation(createPropertyOperationName), { timeout: 15_000 }).catch(() => null);
		await formPage.clickCreate();

		await formPage.firstValidationError.waitFor({ state: 'visible', timeout: 750 }).catch(() => undefined);
		if (await formPage.firstValidationError.isVisible().catch(() => false)) {
			const errorText = await formPage.firstValidationError.textContent();
			await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'ERROR'), notes<PropertyE2ENotes>().set('lastPropertyError', errorText || 'Validation error'));
			return;
		}

		const mutationResponse = await createMutationResponse;
		if (!mutationResponse) {
			const message = `Timed out waiting for the ${createPropertyOperationName} request`;
			await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'ERROR'), notes<PropertyE2ENotes>().set('lastPropertyError', message));
			throw new Error(message);
		}

		const payload = selectGraphqlPayload((await mutationResponse.json().catch(() => null)) as PropertyCreateGraphqlPayload | PropertyCreateGraphqlPayload[] | null, (data) => Boolean(data?.propertyCreate));
		const graphqlError = graphqlErrors(payload);
		const mutationResult = payload?.data?.propertyCreate;
		if (graphqlError || mutationResult?.status?.success !== true) {
			const message = mutationResult?.status?.errorMessage ?? graphqlError ?? `${createPropertyOperationName} did not report success: ${JSON.stringify(payload)}`;
			await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'ERROR'), notes<PropertyE2ENotes>().set('lastPropertyError', message));
			return;
		}

		const propertyId = mutationResult.property?.id;
		if (propertyId) {
			recordPropertyId(propertyName, propertyId);
		}

		await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'SUCCESS'), notes<PropertyE2ENotes>().set('lastPropertyError', null));
	});
