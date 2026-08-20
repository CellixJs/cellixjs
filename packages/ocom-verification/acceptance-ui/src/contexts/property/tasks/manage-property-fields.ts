import { TaskStep } from '@cellix/serenity-framework/serenity';
import type { PropertyAddressSelectFieldKey, PropertyFormPage, PropertyFormTextFieldKey, PropertyListingFlagKey } from '@ocom-verification/verification-shared/pages';
import { type Actor, notes, Task } from '@serenity-js/core';
import { mockPropertyCount } from '../abilities/mock-property-backend.ts';
import type { PropertyUiNotes } from '../notes/property-ui-notes.ts';
import { flushUi, formPageFor, listPageFor, OpenPropertiesList, OpenPropertyDetail, waitUntilUi } from './properties-screen.ts';

const LISTING_FLAG_KEYS: ReadonlySet<string> = new Set(['listedForSale', 'listedForRent', 'listedForLease', 'listedInDirectory']);

const ADDRESS_SELECT_KEYS: ReadonlySet<string> = new Set(['country', 'countrySubdivision']);

/**
 * Fill an address field that may be rendered as a plain text input (legacy
 * form) or as an antd Select dropdown. The select path picks the option whose
 * label corresponds to the stored value (state codes map to full names).
 */
export async function fillAddressField(formPage: PropertyFormPage, field: PropertyAddressSelectFieldKey, value: string): Promise<void> {
	if (!(await formPage.addressControlIsSelect(field))) {
		await formPage.fillField(field, value);
		return;
	}
	const label = formPage.addressOptionLabelFor(field, value);
	await formPage.openAddressSelect(field);
	await flushUi();
	if (!(await formPage.addressOptionLabelled(label).isVisible())) {
		// Long option lists may be virtualised; searching brings the option into the DOM.
		await formPage.searchAddressOption(field, label);
	}
	await waitUntilUi(() => formPage.addressOptionLabelled(label).isVisible(), `Expected the "${field}" dropdown to offer the option "${label}"`);
	await formPage.clickAddressOption(label);
	await flushUi();
}

/**
 * Fill every field of a flat property-field table into the rendered form.
 * Listing flags are toggled; country and state tolerate both text inputs and
 * dropdown selects; all other keys map to text inputs by field key.
 */
export async function fillFieldTable(formPage: PropertyFormPage, details: Record<string, string>): Promise<void> {
	for (const [key, value] of orderCountryFirst(Object.entries(details))) {
		if (LISTING_FLAG_KEYS.has(key)) {
			await formPage.setListingFlag(key as PropertyListingFlagKey, value === 'true');
		} else if (ADDRESS_SELECT_KEYS.has(key)) {
			await fillAddressField(formPage, key as PropertyAddressSelectFieldKey, value);
		} else {
			await formPage.fillField(key as PropertyFormTextFieldKey, value);
		}
	}
}

/**
 * The state/province control cascades from the selected country (changing the
 * country also clears the subdivision), so the country entry must be applied
 * before any other address field regardless of table order.
 */
function orderCountryFirst(entries: Array<[string, string]>): Array<[string, string]> {
	return [...entries.filter(([key]) => key === 'country'), ...entries.filter(([key]) => key !== 'country')];
}

/**
 * Task that opens the create property form, fills the full field set in one
 * pass, and submits it. Records the baseline property count and the submitted
 * fields in actor notes.
 */
export const CreatePropertyWithFullFieldsViaForm = (details: Record<string, string>): Task =>
	Task.where(
		`#actor creates the property "${details['propertyName'] ?? ''}" with the full field set`,
		new TaskStep<Actor>('#actor fills the full create property form and submits it', async (actor) => {
			await actor.attemptsTo(notes<PropertyUiNotes>().set('baselinePropertyCount', mockPropertyCount()), notes<PropertyUiNotes>().set('submittedPropertyFields', details));
			await actor.attemptsTo(OpenPropertiesList());

			const listPage = listPageFor(actor);
			await listPage.clickAddProperty();

			const formPage = formPageFor(actor);
			await waitUntilUi(() => formPage.propertyNameInput.isVisible(), 'Expected the create property form to render');
			await fillFieldTable(formPage, details);
			await formPage.clickCreate();
			await flushUi();
		}),
	);

/**
 * Task that opens a property's detail form, fills the given field table, and
 * saves. Used for the address, listing detail, amenities, media, and agent
 * update steps.
 */
export const UpdatePropertyFieldsViaForm = (propertyName: string, details: Record<string, string>, activity: string): Task =>
	Task.where(
		`#actor ${activity} of the property "${propertyName}"`,
		new TaskStep<Actor>('#actor edits the detail form fields and saves', async (actor) => {
			await actor.attemptsTo(OpenPropertyDetail(propertyName));
			const formPage = formPageFor(actor);
			await fillFieldTable(formPage, details);
			await formPage.clickSave();
			await flushUi();
		}),
	);

/**
 * Task that assigns the property owner through the Owner member select on the
 * detail form and saves.
 */
export const SetPropertyOwnerViaForm = (propertyName: string, memberName: string): Task =>
	Task.where(
		`#actor sets the owner of the property "${propertyName}" to "${memberName}"`,
		new TaskStep<Actor>('#actor picks the member in the Owner select and saves', async (actor) => {
			await actor.attemptsTo(OpenPropertyDetail(propertyName));
			const formPage = formPageFor(actor);
			await formPage.openOwnerSelect();
			await waitUntilUi(() => formPage.ownerOptionNamed(memberName).isVisible(), `Expected the Owner select to offer the member "${memberName}"`);
			await formPage.clickOwnerOption(memberName);
			await formPage.clickSave();
			await flushUi();
		}),
	);

/**
 * Task that adds a bedroom detail row on the detail form and saves.
 */
export const AddBedroomDetailViaForm = (propertyName: string, roomName: string, bedDescriptions: string): Task =>
	Task.where(
		`#actor adds the bedroom detail "${roomName}" to the property "${propertyName}"`,
		new TaskStep<Actor>('#actor adds a bedroom detail row, fills it, and saves', async (actor) => {
			await actor.attemptsTo(OpenPropertyDetail(propertyName));
			const formPage = formPageFor(actor);
			await formPage.addBedroomDetailButton.click();
			await flushUi();
			await formPage.bedroomRoomNameInput.fill(roomName);
			await formPage.bedroomBedDescriptionsInput.fill(bedDescriptions);
			await formPage.clickSave();
			await flushUi();
		}),
	);

/**
 * Task that adds an additional amenity category row on the detail form and saves.
 */
export const AddAdditionalAmenityViaForm = (propertyName: string, category: string, amenities: string): Task =>
	Task.where(
		`#actor adds the additional amenity category "${category}" to the property "${propertyName}"`,
		new TaskStep<Actor>('#actor adds an additional amenity row, fills it, and saves', async (actor) => {
			await actor.attemptsTo(OpenPropertyDetail(propertyName));
			const formPage = formPageFor(actor);
			await formPage.addAdditionalAmenityButton.click();
			await flushUi();
			await formPage.additionalAmenityCategoryInput.fill(category);
			await formPage.additionalAmenityAmenitiesInput.fill(amenities);
			await formPage.clickSave();
			await flushUi();
		}),
	);
