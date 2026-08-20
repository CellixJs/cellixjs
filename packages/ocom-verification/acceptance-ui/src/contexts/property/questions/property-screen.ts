import { type Actor, Question } from '@serenity-js/core';
import { findMockPropertyByName, PROPERTIES_BASE_PATH } from '../abilities/mock-property-backend.ts';
import { feedbackPage, formPageFor, listPageFor, OpenPropertiesList, RenderPropertiesScreen, waitUntilUi } from '../tasks/properties-screen.ts';

/** Question that reads the property names visible in the rendered list. */
export const ListedPropertyNames = () =>
	Question.about('the listed property names', async (actor) => {
		await (actor as unknown as Actor).attemptsTo(OpenPropertiesList());
		return await listPageFor(actor).listedPropertyNames();
	});

/** Question that waits for a property to appear in the rendered list. */
export const PropertiesListIncludes = (propertyName: string) =>
	Question.about(`whether the properties list includes "${propertyName}"`, async (actor) => {
		await (actor as unknown as Actor).attemptsTo(OpenPropertiesList());
		const listPage = listPageFor(actor);
		try {
			await waitUntilUi(() => listPage.hasPropertyNamed(propertyName), `Expected the properties list to include "${propertyName}"`);
			return true;
		} catch {
			return false;
		}
	});

/** Question that reads the row cell values for a property in the list. */
export const PropertyRowCells = (propertyName: string) =>
	Question.about(`the listed row cells of "${propertyName}"`, async (actor) => {
		await (actor as unknown as Actor).attemptsTo(OpenPropertiesList());
		const listPage = listPageFor(actor);
		await waitUntilUi(() => listPage.hasPropertyNamed(propertyName), `Expected the properties list to include "${propertyName}"`);
		return await listPage.rowCellsFor(propertyName);
	});

/** Question that reads the property name shown by the detail form. */
export const DetailPropertyNameValue = () => Question.about('the property detail form name', async (actor) => await formPageFor(actor).propertyNameValue());

/** Question that waits for a success message after a property mutation. */
export const SuccessFeedbackVisible = () =>
	Question.about('whether a property success message is visible', async () => {
		try {
			await waitUntilUi(() => feedbackPage().successFeedback.isVisible(), 'Expected a success message');
			return true;
		} catch {
			return false;
		}
	});

/** Question that waits for a form validation error matching the given pattern. */
export const ValidationErrorMatching = (expectedPattern: RegExp) =>
	Question.about(`whether a validation error matching ${expectedPattern} is visible`, async (actor) => {
		const formPage = formPageFor(actor);
		try {
			await waitUntilUi(async () => {
				if (!(await formPage.firstValidationError.isVisible())) {
					return false;
				}
				const text = (await formPage.firstValidationError.textContent()) ?? '';
				return expectedPattern.test(text);
			}, `Expected a validation error matching ${expectedPattern}`);
			return true;
		} catch {
			return false;
		}
	});

/**
 * Question that answers whether the rendered admin properties section admits
 * the acting member, i.e. the permission guard does not show a 403 result.
 */
export const ManagePropertiesAllowed = () =>
	Question.about('whether the member is allowed to manage properties', async (actor) => {
		await (actor as unknown as Actor).attemptsTo(RenderPropertiesScreen());
		const listPage = listPageFor(actor);
		try {
			await waitUntilUi(() => listPage.heading.isVisible(), 'Expected the properties list to render for an authorized member');
		} catch {
			return false;
		}
		return await listPage.addPropertyButton.isVisible();
	});

/**
 * Question that answers whether a deleted property's detail deep link renders
 * the not-found result instead of the property form.
 */
export const PropertyNoLongerRetrievable = (propertyName: string) =>
	Question.about(`whether the property "${propertyName}" is no longer retrievable`, async (actor) => {
		const property = findMockPropertyByName(propertyName);
		if (!property) {
			throw new Error(`No property named "${propertyName}" is known in this scenario. Did an actor create it first?`);
		}
		await (actor as unknown as Actor).attemptsTo(RenderPropertiesScreen([`${PROPERTIES_BASE_PATH}/${property.id}`]));
		const formPage = formPageFor(actor);
		try {
			await waitUntilUi(() => formPage.notFoundResult.isVisible(), `Expected the detail screen of "${propertyName}" to report the property as not found`);
			return true;
		} catch {
			return false;
		}
	});
