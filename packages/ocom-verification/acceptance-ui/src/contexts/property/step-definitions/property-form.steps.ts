import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import type { PropertyFormTextFieldKey } from '@ocom-verification/verification-shared/pages';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import { delayPropertyCreateResponses } from '../abilities/mock-property-backend.ts';
import type { PropertyUiNotes } from '../notes/property-ui-notes.ts';
import {
	InlineErrorForField,
	LastPropertyUpdateInput,
	NumberFieldPresentationOf,
	PropertyCreateRequestCount,
	PropertyDetailFormShown,
	PropertyUpdateRequestCount,
	StateFieldIsSelect,
	StateFieldOffersOption,
	StateFieldSelection,
} from '../questions/property-form-screen.ts';
import { UpdatePropertyViaForm } from '../tasks/manage-property.ts';
import { ClearPropertyTagsViaForm, SaveAndClosePropertyViaForm, SaveAndCloseWithClearedNameViaForm, SelectAddressDropdownsViaForm, SubmitPropertyCreateTwice, SwitchCountryWithoutSaving } from '../tasks/property-form-actions.ts';

Given('the property backend delays create responses', () => {
	delayPropertyCreateResponses(75);
});

When('{word} clears the tags of the property {string} through the form', async (actorName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(ClearPropertyTagsViaForm(propertyName));
});

Then('the property update should send an empty tags list', async () => {
	const input = await actorInTheSpotlight().answer(LastPropertyUpdateInput());
	if (!input) {
		throw new Error('Expected a property update request to have been sent, but none was recorded');
	}
	if (!Array.isArray(input.tags) || input.tags.length > 0) {
		throw new Error(`Expected the property update to send an empty tags list ([]), but it sent: ${JSON.stringify(input.tags)}`);
	}
});

When('{word} saves and closes the property {string} after setting {string} to {string}', async (actorName: string, propertyName: string, field: string, value: string) => {
	await actorCalled(actorName).attemptsTo(SaveAndClosePropertyViaForm(propertyName, field as PropertyFormTextFieldKey, value));
});

When('{word} attempts to save and close the property {string} after clearing the property name', async (actorName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(SaveAndCloseWithClearedNameViaForm(propertyName));
});

Then('she should see an inline error for the {string} field', async (fieldName: string) => {
	const error = await actorInTheSpotlight().answer(InlineErrorForField(fieldName as PropertyFormTextFieldKey));
	if (!error) {
		throw new Error(`Expected an inline validation error for the "${fieldName}" field, but none is shown`);
	}
});

Then('no property update should be sent', async () => {
	const actor = actorInTheSpotlight();
	const baseline = await actor.answer(notes<PropertyUiNotes>().get('updateCallCountBeforeSubmit'));
	const current = await actor.answer(PropertyUpdateRequestCount());
	if (current > baseline) {
		throw new Error(`Expected no property update request to be sent, but ${current - baseline} update request(s) reached the backend`);
	}
});

Then('{word} should remain on the property details page', async (actorName: string) => {
	if (!(await actorCalled(actorName).answer(PropertyDetailFormShown()))) {
		throw new Error('Expected to remain on the property details page, but the detail form is no longer shown');
	}
});

When('{word} submits the property create form twice for a property named {string}', async (actorName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(SubmitPropertyCreateTwice(propertyName));
});

Then('exactly one property create request should be sent', async () => {
	const count = await actorInTheSpotlight().answer(PropertyCreateRequestCount());
	if (count !== 1) {
		throw new Error(`Expected exactly one property create request to be sent, but ${count} were sent`);
	}
});

When('{word} attempts to update the property {string} with a tags entry of 101 characters', async (actorName: string, propertyName: string) => {
	const oversizedEntry = 'x'.repeat(101);
	await actorCalled(actorName).attemptsTo(UpdatePropertyViaForm(propertyName, { tags: `sunny, ${oversizedEntry}` }));
});

When('{word} attempts to update the property {string} with 51 tags', async (actorName: string, propertyName: string) => {
	const tags = Array.from({ length: 51 }, (_, index) => `tag${index + 1}`).join(', ');
	await actorCalled(actorName).attemptsTo(UpdatePropertyViaForm(propertyName, { tags }));
});

When('{word} selects the state {string} and country {string} of the property {string} from dropdowns', async (actorName: string, stateName: string, countryName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(SelectAddressDropdownsViaForm(propertyName, stateName, countryName));
});

When('{word} switches the country of the property {string} to {string} without saving', async (actorName: string, propertyName: string, countryName: string) => {
	await actorCalled(actorName).attemptsTo(SwitchCountryWithoutSaving(propertyName, countryName));
});

Then('the state field of the property form should have no selection', async () => {
	const selection = await actorInTheSpotlight().answer(StateFieldSelection());
	if (selection !== '') {
		throw new Error(`Expected the state field to have no selection after the country changed, but it shows: "${selection}"`);
	}
});

Then('the state field of the property form should offer the option {string}', async (label: string) => {
	const offered = await actorInTheSpotlight().answer(StateFieldOffersOption(label));
	if (!offered) {
		throw new Error(`Expected the state dropdown to offer the option "${label}", but it does not`);
	}
});

Then('the state field of the property form should be a text input', async () => {
	const isSelect = await actorInTheSpotlight().answer(StateFieldIsSelect());
	if (isSelect) {
		throw new Error('Expected the state field to fall back to a free-text input for a country without subdivisions, but it is a dropdown select');
	}
});

Then('the property form should present the number fields:', async (dataTable: DataTable) => {
	const actor = actorInTheSpotlight();
	const problems: string[] = [];
	for (const row of dataTable.hashes()) {
		const field = row['field'] as PropertyFormTextFieldKey;
		const expectedText = (row['adornment'] ?? '').trim();
		const expectedPlacement = (row['placement'] ?? 'none').trim();
		const expectSpinner = (row['controls'] ?? '').trim() === 'spinner';
		const presentation = await actor.answer(NumberFieldPresentationOf(field));
		if (presentation.adornment.placement !== expectedPlacement || presentation.adornment.text !== expectedText) {
			const expected = expectedPlacement === 'none' ? 'no unit adornment' : `the ${expectedPlacement} "${expectedText}"`;
			const actual = presentation.adornment.placement === 'none' ? 'none' : `the ${presentation.adornment.placement} "${presentation.adornment.text}"`;
			problems.push(`${field}: expected ${expected} but found ${actual}`);
		}
		if (presentation.hasSpinnerControls !== expectSpinner) {
			problems.push(`${field}: expected ${expectSpinner ? 'spinner controls' : 'no spinner controls'} but ${presentation.hasSpinnerControls ? 'found them' : 'found none'}`);
		}
	}
	if (problems.length > 0) {
		throw new Error(`The property form does not present the number fields as expected:\n${problems.join('\n')}`);
	}
});
