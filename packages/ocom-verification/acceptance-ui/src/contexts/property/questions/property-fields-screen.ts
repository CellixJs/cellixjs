import type { PropertyAddressSelectFieldKey, PropertyFormPage, PropertyFormTextFieldKey, PropertyListingFlagKey } from '@ocom-verification/verification-shared/pages';
import { type Actor, Question } from '@serenity-js/core';
import { formPageFor, listPageFor, OpenPropertiesList, OpenPropertyDetail, waitUntilUi } from '../tasks/properties-screen.ts';

const LISTING_FLAG_KEYS: ReadonlySet<string> = new Set(['listedForSale', 'listedForRent', 'listedForLease', 'listedInDirectory']);

const ADDRESS_SELECT_KEYS: ReadonlySet<string> = new Set(['country', 'countrySubdivision']);

/** Read the displayed value of a flat field-table key from the rendered form. */
async function displayedFieldValue(formPage: PropertyFormPage, key: string): Promise<string> {
	if (LISTING_FLAG_KEYS.has(key)) {
		return String(await formPage.listingFlagState(key as PropertyListingFlagKey));
	}
	if (ADDRESS_SELECT_KEYS.has(key)) {
		// Country and state read identically whether rendered as inputs or selects.
		return await formPage.addressFieldDisplayValue(key as PropertyAddressSelectFieldKey);
	}
	return await formPage.fieldValue(key as PropertyFormTextFieldKey);
}

/** Question that reads the text of a properties-list cell by column title. */
export const ListCellInColumn = (propertyName: string, columnTitle: string) =>
	Question.about(`the "${columnTitle}" list cell of "${propertyName}"`, async (actor) => {
		await (actor as unknown as Actor).attemptsTo(OpenPropertiesList());
		const listPage = listPageFor(actor);
		await waitUntilUi(() => listPage.hasPropertyNamed(propertyName), `Expected the properties list to include "${propertyName}"`);
		return await listPage.cellInColumn(propertyName, columnTitle);
	});

/**
 * Question that answers whether the currently rendered screen is the
 * properties list (used right after a create submission, without re-rendering).
 */
export const OnPropertiesList = () =>
	Question.about('whether the properties list screen is shown', async (actor) => {
		const listPage = listPageFor(actor);
		try {
			await waitUntilUi(() => listPage.heading.isVisible(), 'Expected the properties list screen to be shown');
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
		await (actor as unknown as Actor).attemptsTo(OpenPropertyDetail(propertyName));
		const formPage = formPageFor(actor);
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
		await (actor as unknown as Actor).attemptsTo(OpenPropertyDetail(propertyName));
		return await formPageFor(actor).selectedOwnerText();
	});

/** Question that reads the first bedroom-detail row values from a property's detail form. */
export const BedroomDetailRowValues = (propertyName: string) =>
	Question.about(`the first bedroom detail row of "${propertyName}"`, async (actor) => {
		await (actor as unknown as Actor).attemptsTo(OpenPropertyDetail(propertyName));
		const formPage = formPageFor(actor);
		return {
			roomName: ((await formPage.bedroomRoomNameInput.inputValue()) ?? '').trim(),
			bedDescriptions: ((await formPage.bedroomBedDescriptionsInput.inputValue()) ?? '').trim(),
		};
	});

/** Question that reads the first additional-amenity row values from a property's detail form. */
export const AdditionalAmenityRowValues = (propertyName: string) =>
	Question.about(`the first additional amenity row of "${propertyName}"`, async (actor) => {
		await (actor as unknown as Actor).attemptsTo(OpenPropertyDetail(propertyName));
		const formPage = formPageFor(actor);
		return {
			category: ((await formPage.additionalAmenityCategoryInput.inputValue()) ?? '').trim(),
			amenities: ((await formPage.additionalAmenityAmenitiesInput.inputValue()) ?? '').trim(),
		};
	});

/** Question that waits for the bathrooms increment validation message on the form. */
export const BathroomsIncrementMessageVisible = () =>
	Question.about('whether the bathrooms increment validation message is visible', async (actor) => {
		const formPage = formPageFor(actor);
		try {
			await waitUntilUi(() => formPage.bathroomsIncrementError.isVisible(), 'Expected the bathrooms increment validation message');
			return true;
		} catch {
			return false;
		}
	});

/** Question that answers whether the current screen shows the given page title. */
export const PageTitledVisible = (title: string) =>
	Question.about(`whether the page title "${title}" is shown`, async (actor) => {
		const formPage = formPageFor(actor);
		try {
			await waitUntilUi(() => formPage.headerTitled(title).isVisible(), `Expected the page title "${title}"`);
			return true;
		} catch {
			return false;
		}
	});
