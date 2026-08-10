import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, notes, Task } from '@serenity-js/core';
import { mockPropertyCount } from '../abilities/mock-property-backend.ts';
import type { PropertyUiNotes } from '../notes/property-ui-notes.ts';
import { feedbackPage, flushUi, formPageFor, listPageFor, OpenPropertiesList, OpenPropertyDetail, waitUntilUi } from './properties-screen.ts';

/** Details captured from the property update form Gherkin table. */
export interface PropertyFormInput {
	propertyName?: string;
	propertyType?: string;
	bedrooms?: string;
	bathrooms?: string;
	squareFeet?: string;
}

/**
 * Task that opens the create property form, fills it, and submits it,
 * recording the baseline property count in actor notes for negative-path
 * checks.
 */
export const CreatePropertyViaForm = (details: PropertyFormInput): Task =>
	Task.where(
		`#actor creates a property named "${details.propertyName ?? ''}"`,
		new TaskStep<Actor>('#actor fills and submits the create property form', async (actor) => {
			await actor.attemptsTo(notes<PropertyUiNotes>().set('baselinePropertyCount', mockPropertyCount()));
			await actor.attemptsTo(OpenPropertiesList());

			const listPage = listPageFor(actor);
			await listPage.clickAddProperty();

			const formPage = formPageFor(actor);
			await waitUntilUi(() => formPage.propertyNameInput.isVisible(), 'Expected the create property form to render');
			if (details.propertyName) {
				await formPage.fillPropertyName(details.propertyName);
			}
			await formPage.clickCreate();
			await flushUi();
		}),
	);

/**
 * Task that updates a property through the detail form.
 */
export const UpdatePropertyViaForm = (propertyName: string, details: PropertyFormInput): Task =>
	Task.where(
		`#actor updates the property "${propertyName}"`,
		new TaskStep<Actor>('#actor edits the detail form fields and saves', async (actor) => {
			await actor.attemptsTo(OpenPropertyDetail(propertyName));
			const formPage = formPageFor(actor);
			if (details.propertyName !== undefined) {
				await formPage.fillPropertyName(details.propertyName);
			}
			if (details.propertyType !== undefined) {
				await formPage.fillPropertyType(details.propertyType);
			}
			if (details.bedrooms !== undefined) {
				await formPage.fillBedrooms(Number(details.bedrooms));
			}
			if (details.bathrooms !== undefined) {
				await formPage.fillBathrooms(Number(details.bathrooms));
			}
			if (details.squareFeet !== undefined) {
				await formPage.fillSquareFeet(Number(details.squareFeet));
			}
			await formPage.clickSave();
			await flushUi();
		}),
	);

/**
 * Task that removes a property through the detail page's confirmation modal.
 */
export const DeletePropertyViaConfirm = (propertyName: string): Task =>
	Task.where(
		`#actor deletes the property "${propertyName}"`,
		new TaskStep<Actor>('#actor confirms the removal in the modal', async (actor) => {
			await actor.attemptsTo(OpenPropertyDetail(propertyName));
			const formPage = formPageFor(actor);
			await formPage.clickRemoveProperty();

			// The confirmation modal portals to document.body.
			const modalPage = feedbackPage();
			await waitUntilUi(() => modalPage.removeConfirmationTitle.isVisible(), 'Expected the remove property confirmation modal to render');
			await modalPage.clickConfirmRemove();
			await flushUi();
		}),
	);
