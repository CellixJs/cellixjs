import type { FieldAdornment, PropertyFormTextFieldKey } from '@ocom-verification/verification-shared/pages';
import { Question } from '@serenity-js/core';
import { lastPropertyUpdateInput, type PropertyMutationInput, propertyCreateCallCount, propertyUpdateCallCount } from '../abilities/mock-property-backend.ts';
import { formPageFor, waitUntilUi } from '../tasks/properties-screen.ts';

/**
 * Question that waits for an inline validation error under the given form
 * field and answers its text, or null when none appears.
 */
export const InlineErrorForField = (field: PropertyFormTextFieldKey) =>
	Question.about(`the inline error of the "${field}" field`, async (actor) => {
		const formPage = formPageFor(actor);
		try {
			await waitUntilUi(async () => (await formPage.fieldInlineError(field)) !== null, `Expected an inline error for the "${field}" field`);
		} catch {
			return null;
		}
		return await formPage.fieldInlineError(field);
	});

/** Question that answers how many create requests the mocked property backend received. */
export const PropertyCreateRequestCount = () => Question.about('the number of property create requests sent', () => Promise.resolve(propertyCreateCallCount()));

/** Question that answers how many update requests the mocked property backend received. */
export const PropertyUpdateRequestCount = () => Question.about('the number of property update requests sent', () => Promise.resolve(propertyUpdateCallCount()));

/** Question that answers the input variables of the last property update request. */
export const LastPropertyUpdateInput = (): Question<Promise<PropertyMutationInput | undefined>> => Question.about('the input of the last property update request', () => Promise.resolve(lastPropertyUpdateInput()));

/** Question that answers whether the property detail form is still on screen. */
export const PropertyDetailFormShown = () =>
	Question.about('whether the property detail form is shown', async (actor) => {
		const formPage = formPageFor(actor);
		return (await formPage.propertyNameInput.isVisible()) && (await formPage.saveButton.isVisible());
	});

/** Presentation of a number field on the rendered form: unit adornment and spinner controls. */
interface NumberFieldPresentation {
	adornment: FieldAdornment;
	hasSpinnerControls: boolean;
}

/** Question that reads the unit adornment and spinner-control presence of a number field. */
export const NumberFieldPresentationOf = (field: PropertyFormTextFieldKey) =>
	Question.about(`the presentation of the "${field}" number field`, async (actor): Promise<NumberFieldPresentation> => {
		const formPage = formPageFor(actor);
		return {
			adornment: await formPage.fieldAdornment(field),
			hasSpinnerControls: await formPage.fieldHasSpinnerControls(field),
		};
	});
