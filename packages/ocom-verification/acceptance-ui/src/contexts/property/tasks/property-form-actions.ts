import { TaskStep } from '@cellix/serenity-framework/serenity';
import type { PropertyAddressSelectFieldKey, PropertyFormTextFieldKey } from '@ocom-verification/verification-shared/pages';
import { type Actor, notes, Task } from '@serenity-js/core';
import { mockPropertyCount, propertyCreateCallCount, propertyUpdateCallCount } from '../abilities/mock-property-backend.ts';
import type { PropertyUiNotes } from '../notes/property-ui-notes.ts';
import { fillAddressField, fillFieldTable } from './manage-property-fields.ts';
import { flushUi, formPageFor, listPageFor, OpenPropertiesList, OpenPropertyDetail, waitUntilUi } from './properties-screen.ts';

/**
 * Task that opens a property's detail form, clears the Tags field, and saves,
 * waiting until the update request reaches the mocked backend so its variables
 * can be asserted on.
 */
export const ClearPropertyTagsViaForm = (propertyName: string): Task =>
	Task.where(
		`#actor clears the tags of the property "${propertyName}" through the form`,
		new TaskStep<Actor>('#actor empties the Tags field and saves', async (actor) => {
			await actor.attemptsTo(OpenPropertyDetail(propertyName));
			const formPage = formPageFor(actor);
			await formPage.fillField('tags', '');
			const updatesBefore = propertyUpdateCallCount();
			await actor.attemptsTo(notes<PropertyUiNotes>().set('updateCallCountBeforeSubmit', updatesBefore));
			await formPage.clickSave();
			await waitUntilUi(() => Promise.resolve(propertyUpdateCallCount() > updatesBefore), 'Expected saving the form to send a property update request');
		}),
	);

/**
 * Task that edits one field on a property's detail form and submits it through
 * the "Save & Close" button. Fails fast when the form does not offer that
 * button yet.
 */
export const SaveAndClosePropertyViaForm = (propertyName: string, field: PropertyFormTextFieldKey, value: string): Task =>
	Task.where(
		`#actor saves and closes the property "${propertyName}" after setting "${field}" to "${value}"`,
		new TaskStep<Actor>('#actor edits the field and clicks Save & Close', async (actor) => {
			await actor.attemptsTo(OpenPropertyDetail(propertyName));
			const formPage = formPageFor(actor);
			await fillFieldTable(formPage, { [field]: value });
			await actor.attemptsTo(notes<PropertyUiNotes>().set('updateCallCountBeforeSubmit', propertyUpdateCallCount()));
			if (!(await formPage.saveAndCloseButton.isVisible())) {
				throw new Error('Expected the property details form to show a "Save & Close" button, but it does not');
			}
			await formPage.clickSaveAndClose();
			await flushUi();
		}),
	);

/**
 * Task that clears the required property name on a property's detail form and
 * submits it through the "Save & Close" button, so validation must block the
 * save and the navigation. Fails fast when the form does not offer that
 * button yet.
 */
export const SaveAndCloseWithClearedNameViaForm = (propertyName: string): Task =>
	Task.where(
		`#actor attempts to save and close the property "${propertyName}" after clearing the property name`,
		new TaskStep<Actor>('#actor clears the name and clicks Save & Close', async (actor) => {
			await actor.attemptsTo(OpenPropertyDetail(propertyName));
			const formPage = formPageFor(actor);
			await formPage.fillPropertyName('');
			await actor.attemptsTo(notes<PropertyUiNotes>().set('updateCallCountBeforeSubmit', propertyUpdateCallCount()));
			if (!(await formPage.saveAndCloseButton.isVisible())) {
				throw new Error('Expected the property details form to show a "Save & Close" button, but it does not');
			}
			await formPage.clickSaveAndClose();
			await flushUi();
		}),
	);

/**
 * Task that opens the create form, fills the property name, and clicks the
 * Create button twice in quick succession, then waits for the delayed create
 * response(s) to settle so the request count can be asserted on.
 */
export const SubmitPropertyCreateTwice = (propertyName: string): Task =>
	Task.where(
		`#actor submits the property create form twice for "${propertyName}"`,
		new TaskStep<Actor>('#actor double-clicks the Create button', async (actor) => {
			await actor.attemptsTo(notes<PropertyUiNotes>().set('baselinePropertyCount', mockPropertyCount()));
			await actor.attemptsTo(OpenPropertiesList());
			const listPage = listPageFor(actor);
			await listPage.clickAddProperty();
			const formPage = formPageFor(actor);
			await waitUntilUi(() => formPage.propertyNameInput.isVisible(), 'Expected the create property form to render');
			await formPage.fillPropertyName(propertyName);
			const countBefore = mockPropertyCount();
			await formPage.clickCreate();
			await flushUi();
			await formPage.clickCreate();
			await waitUntilUi(() => Promise.resolve(propertyCreateCallCount() >= 1), 'Expected clicking Create to send a property create request');
			// Let the delayed create response(s) land before the count is asserted.
			await waitUntilUi(() => Promise.resolve(mockPropertyCount() > countBefore), 'Expected the delayed property create response to be processed');
			await flushUi();
		}),
	);

/**
 * Task that reopens the detail form of a property and switches only its
 * country dropdown, leaving the form unsaved so the cascade effect on the
 * state field can be asserted.
 */
export const SwitchCountryWithoutSaving = (propertyName: string, countryName: string): Task =>
	Task.where(
		`#actor switches the country of the property "${propertyName}" to "${countryName}" without saving`,
		new TaskStep<Actor>('#actor reopens the detail form and picks the country option', async (actor) => {
			await actor.attemptsTo(OpenPropertyDetail(propertyName));
			const formPage = formPageFor(actor);
			await fillAddressField(formPage, 'country', countryName);
			await flushUi();
		}),
	);

/**
 * Task that selects the state and country of a property from dropdown selects
 * on the detail form and saves. Requires both address fields to actually be
 * dropdowns; a plain text input fails the task.
 */
export const SelectAddressDropdownsViaForm = (propertyName: string, stateName: string, countryName: string): Task =>
	Task.where(
		`#actor selects the state "${stateName}" and country "${countryName}" of the property "${propertyName}" from dropdowns`,
		new TaskStep<Actor>('#actor picks the state and country options and saves', async (actor) => {
			await actor.attemptsTo(OpenPropertyDetail(propertyName));
			const formPage = formPageFor(actor);
			// The state list cascades from the selected country, so pick the country first.
			const selections: ReadonlyArray<[PropertyAddressSelectFieldKey, string, string]> = [
				['country', 'Country', countryName],
				['countrySubdivision', 'State', stateName],
			];
			for (const [field, fieldLabel, optionLabel] of selections) {
				if (!(await formPage.addressControlIsSelect(field))) {
					throw new Error(`Expected the ${fieldLabel} field to be a dropdown select, but it is not`);
				}
				await fillAddressField(formPage, field, optionLabel);
			}
			await formPage.clickSave();
			await flushUi();
		}),
	);
