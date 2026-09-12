import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { Request } from 'playwright';
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
 * Low-level interaction that saves the property detail form currently on
 * screen and records the outcome in actor notes. Client-side validation
 * failures are captured without waiting for a network round trip.
 */
export const SubmitPropertySave = () =>
	Interaction.where(the`#actor saves the property detail form`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = browserPageOf(actor);
		const formPage = propertyFormOn(page);
		let updateMutationSent = false;
		const recordUpdateMutation = (request: Request) => {
			if (request.url().includes('/api/graphql') && request.method() === 'POST' && request.postData()?.includes(updatePropertyOperationName)) {
				updateMutationSent = true;
			}
		};
		page.on('request', recordUpdateMutation);

		const updateMutationResponse = page.waitForResponse(hasGraphqlOperation(updatePropertyOperationName), { timeout: 15_000 }).catch(() => null);
		try {
			await formPage.clickSave();

			await formPage.firstValidationError.waitFor({ state: 'visible', timeout: 750 }).catch(() => undefined);
			if (await formPage.firstValidationError.isVisible().catch(() => false)) {
				await page.waitForTimeout(100);
				if (!updateMutationSent) {
					const errorText = await formPage.firstValidationError.textContent();
					await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'VALIDATION_ERROR'), notes<PropertyE2ENotes>().set('lastPropertyError', errorText || 'Validation error'));
					return;
				}
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

			await actor.attemptsTo(notes<PropertyE2ENotes>().set('lastPropertyStatus', 'SUCCESS'), notes<PropertyE2ENotes>().set('lastPropertyError', null));
		} finally {
			page.off('request', recordUpdateMutation);
		}
	});
