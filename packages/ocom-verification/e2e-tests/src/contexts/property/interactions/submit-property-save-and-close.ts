import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { graphqlErrors, hasGraphqlOperation, selectGraphqlPayload } from '../../../shared/support/graphql-response.ts';
import { browserPageOf, propertyFormOn, recordPropertyId } from '../abilities/admin-portal-page.ts';
import type { PropertyE2ENotes } from '../notes/property-notes.ts';

const updatePropertyOperationName = 'AdminPropertiesDetailContainerPropertyUpdate';

type PropertyUpdateGraphqlPayload = {
	data?: {
		propertyUpdate?: {
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
 * Low-level interaction that submits the property detail form through the
 * "Save & Close" button and waits for the app to navigate back to the
 * properties list. Fails fast when the form does not offer that button.
 * Client-side validation failures are captured without waiting for a network
 * round trip.
 */
export const SubmitPropertySaveAndClose = () =>
	Interaction.where(the`#actor saves and closes the property detail form`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = browserPageOf(actor);
		const formPage = propertyFormOn(page);

		try {
			await formPage.saveAndCloseButton.waitFor({ state: 'visible', timeout: 5_000 });
		} catch {
			throw new Error('Expected the property details form to show a "Save & Close" button, but it does not');
		}

		const updateMutationResponse = page.waitForResponse(hasGraphqlOperation(updatePropertyOperationName), { timeout: 15_000 }).catch(() => null);
		await formPage.clickSaveAndClose();

		await formPage.firstValidationError.waitFor({ state: 'visible', timeout: 750 }).catch(() => undefined);
		if (await formPage.firstValidationError.isVisible().catch(() => false)) {
			const errorText = await formPage.firstValidationError.textContent();
			await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'ERROR'), notes<PropertyE2ENotes>().set('lastPropertyError', errorText || 'Validation error'));
			return;
		}

		const mutationResponse = await updateMutationResponse;
		if (!mutationResponse) {
			const message = `Timed out waiting for the ${updatePropertyOperationName} request`;
			await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'ERROR'), notes<PropertyE2ENotes>().set('lastPropertyError', message));
			throw new Error(message);
		}

		const payload = selectGraphqlPayload((await mutationResponse.json().catch(() => null)) as PropertyUpdateGraphqlPayload | PropertyUpdateGraphqlPayload[] | null, (data) => Boolean(data?.propertyUpdate));
		const graphqlError = graphqlErrors(payload);
		const mutationResult = payload?.data?.propertyUpdate;
		if (graphqlError || mutationResult?.status?.success !== true) {
			const message = mutationResult?.status?.errorMessage ?? graphqlError ?? `${updatePropertyOperationName} did not report success: ${JSON.stringify(payload)}`;
			await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'ERROR'), notes<PropertyE2ENotes>().set('lastPropertyError', message));
			return;
		}

		const updatedId = mutationResult.property?.id;
		const updatedName = mutationResult.property?.propertyName;
		if (updatedId && updatedName) {
			recordPropertyId(updatedName, updatedId);
		}

		// Save & Close navigates back to the properties list after a successful save.
		await page.waitForURL((url) => url.pathname.endsWith('/properties'), { timeout: 15_000 });
		await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'SUCCESS'), notes<PropertyE2ENotes>().set('lastPropertyError', null));
	});
