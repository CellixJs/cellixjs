import type { PropertyAddressSelectFieldKey, PropertyFormPage, PropertyFormTextFieldKey, PropertyListingFlagKey } from '@ocom-verification/verification-shared/pages';
import { Question } from '@serenity-js/core';
import { adminBasePathOf, browserPageOf, openPropertiesListOn, openPropertyDetailOn, propertyFormOn, waitUntil } from '../abilities/admin-portal-page.ts';

const LISTING_FLAG_KEYS: ReadonlySet<string> = new Set(['listedForSale', 'listedForRent', 'listedForLease', 'listedInDirectory']);

const ADDRESS_SELECT_KEYS: ReadonlySet<string> = new Set(['country', 'countrySubdivision']);

/**
 * Read the displayed value of a flat field-table key from the live form.
 * Missing controls answer '' immediately instead of waiting on locators.
 */
async function displayedFieldValue(formPage: PropertyFormPage, key: string): Promise<string> {
	if (LISTING_FLAG_KEYS.has(key)) {
		if (!(await formPage.listingFlagSwitch(key as PropertyListingFlagKey).isVisible())) {
			return '';
		}
		return String(await formPage.listingFlagState(key as PropertyListingFlagKey));
	}
	const input = formPage.fieldInput(key as PropertyFormTextFieldKey);
	if (!(await input.isVisible())) {
		return '';
	}
	if (ADDRESS_SELECT_KEYS.has(key)) {
		// Country and state read identically whether rendered as inputs or selects.
		return await formPage.addressFieldDisplayValue(key as PropertyAddressSelectFieldKey);
	}
	return (await input.inputValue()) ?? '';
}

/** Question that reads the text of a properties-list cell by column title. */
export const ListCellInColumn = (propertyName: string, columnTitle: string) =>
	Question.about(`the "${columnTitle}" list cell of "${propertyName}"`, async (actor) => {
		const page = browserPageOf(actor);
		const listPage = await openPropertiesListOn(page, await adminBasePathOf(actor));
		await waitUntil(() => listPage.hasPropertyNamed(propertyName), `Expected the properties list to include "${propertyName}"`);
		return await listPage.cellInColumn(propertyName, columnTitle);
	});

/**
 * Question that answers whether the browser currently sits on the properties
 * list route (used right after a create submission, without re-navigating).
 */
export const OnPropertiesListNow = () =>
	Question.about('whether the browser is on the properties list', async (actor) => {
		const page = browserPageOf(actor);
		try {
			await waitUntil(() => Promise.resolve(new URL(page.url()).pathname.endsWith('/properties')), 'Expected the browser to land back on the properties list', 10_000);
			return true;
		} catch {
			return false;
		}
	});

/**
 * Question that opens a property's detail form and reports every submitted
 * field whose displayed value does not match. Answers an empty list when the
 * form reflects the whole field set.
 */
export const DetailFormFieldMismatches = (propertyName: string, expected: Record<string, string>) =>
	Question.about(`the detail form mismatches of "${propertyName}"`, async (actor) => {
		const page = browserPageOf(actor);
		const formPage = await openPropertyDetailOn(page, await adminBasePathOf(actor), propertyName);
		const mismatches: string[] = [];
		for (const [key, rawExpected] of Object.entries(expected)) {
			const actualValue = (await displayedFieldValue(formPage, key)).trim();
			const expectedValue = rawExpected.trim();
			const bothNumeric = expectedValue !== '' && !Number.isNaN(Number(expectedValue)) && actualValue !== '' && !Number.isNaN(Number(actualValue));
			const matches = bothNumeric ? Number(actualValue) === Number(expectedValue) : actualValue === expectedValue;
			if (!matches) {
				mismatches.push(`${key}: expected "${expectedValue}" but the form shows "${actualValue}"`);
			}
		}
		return mismatches;
	});

/** Question that reads the owner member name selected on a property's detail form. */
export const SelectedOwnerName = (propertyName: string) =>
	Question.about(`the selected owner of "${propertyName}"`, async (actor) => {
		const page = browserPageOf(actor);
		const formPage = await openPropertyDetailOn(page, await adminBasePathOf(actor), propertyName);
		if (!(await formPage.ownerSelectedItem.isVisible())) {
			return '';
		}
		return await formPage.selectedOwnerText();
	});

/** Question that reads the first bedroom-detail row values from a property's detail form. */
export const BedroomDetailRowValues = (propertyName: string) =>
	Question.about(`the first bedroom detail row of "${propertyName}"`, async (actor) => {
		const page = browserPageOf(actor);
		const formPage = await openPropertyDetailOn(page, await adminBasePathOf(actor), propertyName);
		const roomNameVisible = await formPage.bedroomRoomNameInput.isVisible();
		const bedDescriptionsVisible = await formPage.bedroomBedDescriptionsInput.isVisible();
		return {
			roomName: roomNameVisible ? ((await formPage.bedroomRoomNameInput.inputValue()) ?? '').trim() : '',
			bedDescriptions: bedDescriptionsVisible ? ((await formPage.bedroomBedDescriptionsInput.inputValue()) ?? '').trim() : '',
		};
	});

/** Question that reads the first additional-amenity row values from a property's detail form. */
export const AdditionalAmenityRowValues = (propertyName: string) =>
	Question.about(`the first additional amenity row of "${propertyName}"`, async (actor) => {
		const page = browserPageOf(actor);
		const formPage = await openPropertyDetailOn(page, await adminBasePathOf(actor), propertyName);
		const categoryVisible = await formPage.additionalAmenityCategoryInput.isVisible();
		const amenitiesVisible = await formPage.additionalAmenityAmenitiesInput.isVisible();
		return {
			category: categoryVisible ? ((await formPage.additionalAmenityCategoryInput.inputValue()) ?? '').trim() : '',
			amenities: amenitiesVisible ? ((await formPage.additionalAmenityAmenitiesInput.inputValue()) ?? '').trim() : '',
		};
	});

/** Question that reads the Bathrooms field's inline validation message. */
export const BathroomsIncrementMessage = () =>
	Question.about('the bathrooms inline validation message', async (actor) => {
		const formPage = propertyFormOn(browserPageOf(actor));
		try {
			await waitUntil(async () => (await formPage.fieldInlineError('bathrooms')) !== null, 'Expected the bathrooms increment validation message', 5_000);
			return await formPage.fieldInlineError('bathrooms');
		} catch {
			return null;
		}
	});

/** Question that answers whether the current screen shows the given page title. */
export const PageTitledVisible = (title: string) =>
	Question.about(`whether the page title "${title}" is shown`, async (actor) => {
		const formPage = propertyFormOn(browserPageOf(actor));
		try {
			await waitUntil(() => formPage.headerTitled(title).isVisible(), `Expected the page title "${title}"`, 5_000);
			return true;
		} catch {
			return false;
		}
	});
