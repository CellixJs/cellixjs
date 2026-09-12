import { type Actor, notes, Question } from '@serenity-js/core';
import { adminBasePathOf, browserPageOf, openPropertiesListOn, PROPERTY_DETAIL_PATH_PATTERN, propertyFormOn, propertyIdFor, waitUntil } from '../abilities/admin-portal-page.ts';
import type { PropertyE2ENotes } from '../notes/property-notes.ts';

/** Outcome recorded for the last property operation submitted through the UI. */
export const LastPropertyStatus = () =>
	Question.about('the last property operation status', async (actor) => {
		try {
			return await (actor as unknown as Actor).answer(notes<PropertyE2ENotes>().get('lastPropertyStatus'));
		} catch {
			return null;
		}
	});

/** Error captured from the last property operation, if any. */
export const LastPropertyError = () =>
	Question.about('the last property operation error', async (actor) => {
		try {
			return await (actor as unknown as Actor).answer(notes<PropertyE2ENotes>().get('lastPropertyError'));
		} catch {
			return null;
		}
	});

/** Waits until the live properties list includes the given property name. */
export const PropertiesListIncludes = (propertyName: string) =>
	Question.about(`whether the properties list includes "${propertyName}"`, async (actor) => {
		const page = browserPageOf(actor);
		const listPage = await openPropertiesListOn(page, await adminBasePathOf(actor));
		await waitUntil(async () => await listPage.hasPropertyNamed(propertyName), `Expected the properties list to include "${propertyName}", but got: [${(await listPage.listedPropertyNames()).join(', ')}]`);
		return true;
	});

/** Property names currently shown by the live properties list. */
export const ListedPropertyNames = () =>
	Question.about('the listed property names', async (actor) => {
		const page = browserPageOf(actor);
		const listPage = await openPropertiesListOn(page, await adminBasePathOf(actor));
		return await listPage.listedPropertyNames();
	});

/** Row cell values (in column order) for a property in the live list. */
export const PropertyRowCells = (propertyName: string) =>
	Question.about(`the listed row cells of "${propertyName}"`, async (actor) => {
		const page = browserPageOf(actor);
		const listPage = await openPropertiesListOn(page, await adminBasePathOf(actor));
		await waitUntil(() => listPage.hasPropertyNamed(propertyName), `Expected the properties list to include "${propertyName}"`);
		return await listPage.rowCellsFor(propertyName);
	});

/** Property name shown by the detail form currently on screen. */
export const DetailPropertyNameValue = () => Question.about('the property detail form name', async (actor) => await propertyFormOn(browserPageOf(actor)).propertyNameValue());

/**
 * Whether the property detail page currently on screen belongs to the acting
 * member's managed community, i.e. its URL sits under the recorded admin
 * portal base path.
 */
export const ViewedPropertyInManagedCommunity = () =>
	Question.about('whether the viewed property belongs to the managed community', async (actor) => {
		const page = browserPageOf(actor);
		const adminBasePath = await adminBasePathOf(actor);
		const pathname = new URL(page.url()).pathname;
		return PROPERTY_DETAIL_PATH_PATTERN.test(pathname) && pathname.startsWith(`${adminBasePath}/properties/`);
	});

/**
 * Whether a deleted property's detail deep link renders the not-found result
 * instead of the property form.
 */
export const PropertyNoLongerRetrievable = (propertyName: string) =>
	Question.about(`whether the property "${propertyName}" is no longer retrievable`, async (actor) => {
		const propertyId = propertyIdFor(propertyName);
		if (!propertyId) {
			throw new Error(`No property named "${propertyName}" was created in this scenario, so retrievability cannot be checked`);
		}
		const page = browserPageOf(actor);
		const adminBasePath = await adminBasePathOf(actor);
		await page.goto(`${adminBasePath}/properties/${propertyId}`, { waitUntil: 'networkidle' });
		const formPage = propertyFormOn(page);
		await waitUntil(() => formPage.notFoundResult.isVisible(), `Expected the detail page of "${propertyName}" to report the property as not found`);
		return true;
	});

/**
 * Whether the admin properties section admits the acting member, i.e. the
 * permission guard renders the list with its actions instead of a 403 result.
 */
export const ManagePropertiesAllowed = () =>
	Question.about('whether the member is allowed to manage properties', async (actor) => {
		const page = browserPageOf(actor);
		const listPage = await openPropertiesListOn(page, await adminBasePathOf(actor));
		return await listPage.addPropertyButton.isVisible();
	});

/** Waits for a form validation error matching the given pattern. */
export const ValidationErrorMatching = (expectedPattern: RegExp) =>
	Question.about(`whether a validation error matching ${expectedPattern} is visible`, async (actor) => {
		const formPage = propertyFormOn(browserPageOf(actor));
		await waitUntil(async () => {
			if (!(await formPage.firstValidationError.isVisible())) {
				return false;
			}
			const text = (await formPage.firstValidationError.textContent()) ?? '';
			return expectedPattern.test(text);
		}, `Expected a validation error matching ${expectedPattern}`);
		return true;
	});

/** Property names recorded before the last create attempt. */
export const BaselinePropertyNames = () =>
	Question.about('the baseline property names', async (actor) => {
		try {
			return await (actor as unknown as Actor).answer(notes<PropertyE2ENotes>().get('baselinePropertyNames'));
		} catch {
			return undefined;
		}
	});
