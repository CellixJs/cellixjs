import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Text-input field keys of the property create and detail forms, mapped to
 * form controls by antd label text or, where labels are ambiguous prefixes of
 * other labels, by the form control id (antd derives ids from Form.Item name
 * paths, e.g. `lease` or `listingDetail_lease`).
 */
export type PropertyFormTextFieldKey =
	| 'propertyName'
	| 'propertyType'
	| 'tags'
	| 'streetNumber'
	| 'streetName'
	| 'municipality'
	| 'countrySubdivision'
	| 'postalCode'
	| 'country'
	| 'price'
	| 'rentHigh'
	| 'rentLow'
	| 'lease'
	| 'maxGuests'
	| 'bedrooms'
	| 'bathrooms'
	| 'squareFeet'
	| 'yearBuilt'
	| 'lotSize'
	| 'description'
	| 'amenities'
	| 'images'
	| 'video'
	| 'floorPlan'
	| 'floorPlanImages'
	| 'listingAgent'
	| 'listingAgentPhone'
	| 'listingAgentEmail'
	| 'listingAgentWebsite'
	| 'listingAgentCompany'
	| 'listingAgentCompanyPhone'
	| 'listingAgentCompanyEmail'
	| 'listingAgentCompanyWebsite'
	| 'listingAgentCompanyAddress';

/** Listing flag switches of the property form (antd Switch controls). */
export type PropertyListingFlagKey = 'listedForSale' | 'listedForRent' | 'listedForLease' | 'listedInDirectory';

/** Labels of the text-input fields resolved through `getByLabel`. */
const FIELD_LABELS: Partial<Record<PropertyFormTextFieldKey, string>> = {
	propertyName: 'Property Name',
	propertyType: 'Property Type',
	tags: 'Tags',
	streetNumber: 'Street Number',
	streetName: 'Street Name',
	municipality: 'City',
	countrySubdivision: 'State',
	postalCode: 'Postal Code',
	country: 'Country',
	price: 'Price',
	rentHigh: 'Rent High',
	rentLow: 'Rent Low',
	maxGuests: 'Max Guests',
	bedrooms: 'Bedrooms',
	bathrooms: 'Bathrooms',
	squareFeet: 'Square Feet',
	yearBuilt: 'Year Built',
	lotSize: 'Lot Size',
	video: 'Video',
	floorPlanImages: 'Floor Plan Images',
};

/**
 * Fields whose labels are prefixes of other labels (e.g. "Lease" vs
 * "Listed For Lease") are resolved by control id instead. The id must be the
 * camelCase field key, optionally nested under a form name path.
 */
const ID_RESOLVED_FIELDS: ReadonlySet<PropertyFormTextFieldKey> = new Set([
	'lease',
	'description',
	'amenities',
	'images',
	'floorPlan',
	'listingAgent',
	'listingAgentPhone',
	'listingAgentEmail',
	'listingAgentWebsite',
	'listingAgentCompany',
	'listingAgentCompanyPhone',
	'listingAgentCompanyEmail',
	'listingAgentCompanyWebsite',
	'listingAgentCompanyAddress',
]);

/** Labels of the listing flag switches. */
const LISTING_FLAG_LABELS: Record<PropertyListingFlagKey, string> = {
	listedForSale: 'Listed For Sale',
	listedForRent: 'Listed For Rent',
	listedForLease: 'Listed For Lease',
	listedInDirectory: 'Listed In Directory',
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Page object for the admin property create and detail/edit forms.
 *
 * Works against both the DOM adapter (component acceptance tests) and the
 * Playwright adapter (browser E2E tests).
 */
export class PropertyFormPage extends AdapterBackedPageObject {
	get propertyNameInput(): ElementHandle {
		return this.adapter.getByLabel('Property Name');
	}

	get propertyTypeInput(): ElementHandle {
		return this.adapter.getByLabel('Property Type');
	}

	get bedroomsInput(): ElementHandle {
		return this.adapter.getByLabel('Bedrooms');
	}

	get bathroomsInput(): ElementHandle {
		return this.adapter.getByLabel('Bathrooms');
	}

	get squareFeetInput(): ElementHandle {
		return this.adapter.getByLabel('Square Feet');
	}

	get createButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Create Property/i });
	}

	get saveButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /^Save$/i });
	}

	get removePropertyButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Remove Property/i });
	}

	get removeConfirmationTitle(): ElementHandle {
		return this.adapter.getByText('Remove this property?');
	}

	/** Confirmation (ok) button inside the removal confirmation modal. */
	get confirmRemoveButton(): ElementHandle {
		return this.adapter.locator('.ant-modal .ant-modal-footer button.ant-btn-primary');
	}

	get firstValidationError(): ElementHandle {
		return this.adapter.locator('.ant-form-item-explain-error');
	}

	get errorFeedback(): ElementHandle {
		return this.adapter.locator('.ant-message-error, [role="alert"]');
	}

	get successFeedback(): ElementHandle {
		return this.adapter.locator('.ant-message-success');
	}

	get notFoundResult(): ElementHandle {
		return this.adapter.getByText('Property Not Found');
	}

	async fillPropertyName(value: string): Promise<void> {
		await this.propertyNameInput.fill(value);
	}

	async fillPropertyType(value: string): Promise<void> {
		await this.propertyTypeInput.fill(value);
	}

	async fillBedrooms(value: number): Promise<void> {
		await this.bedroomsInput.fill(String(value));
	}

	async fillBathrooms(value: number): Promise<void> {
		await this.bathroomsInput.fill(String(value));
	}

	async fillSquareFeet(value: number): Promise<void> {
		await this.squareFeetInput.fill(String(value));
	}

	/** Current value of the property name input. */
	async propertyNameValue(): Promise<string> {
		return (await this.propertyNameInput.inputValue()) ?? '';
	}

	/** Current value of the property type input. */
	async propertyTypeValue(): Promise<string> {
		return (await this.propertyTypeInput.inputValue()) ?? '';
	}

	/** Current value of the bedrooms input. */
	async bedroomsValue(): Promise<string> {
		return (await this.bedroomsInput.inputValue()) ?? '';
	}

	/** Current value of the bathrooms input. */
	async bathroomsValue(): Promise<string> {
		return (await this.bathroomsInput.inputValue()) ?? '';
	}

	/** Current value of the square feet input. */
	async squareFeetValue(): Promise<string> {
		return (await this.squareFeetInput.inputValue()) ?? '';
	}

	async clickCreate(): Promise<void> {
		await this.createButton.click();
	}

	async clickSave(): Promise<void> {
		await this.saveButton.click();
	}

	async clickRemoveProperty(): Promise<void> {
		await this.removePropertyButton.click();
	}

	async clickConfirmRemove(): Promise<void> {
		await this.confirmRemoveButton.click();
	}

	/** The text input for the given field key (label-resolved or id-resolved). */
	fieldInput(field: PropertyFormTextFieldKey): ElementHandle {
		if (ID_RESOLVED_FIELDS.has(field)) {
			return this.adapter.locator(`#${field}, [id$="_${field}"]`);
		}
		const label = FIELD_LABELS[field];
		if (!label) {
			throw new Error(`No selector is defined for the property form field "${field}"`);
		}
		return this.adapter.getByLabel(label);
	}

	async fillField(field: PropertyFormTextFieldKey, value: string): Promise<void> {
		await this.fieldInput(field).fill(value);
	}

	/** Current value of the given field's input, or empty string when missing. */
	async fieldValue(field: PropertyFormTextFieldKey): Promise<string> {
		return (await this.fieldInput(field).inputValue()) ?? '';
	}

	/** The antd Switch control for the given listing flag. */
	listingFlagSwitch(flag: PropertyListingFlagKey): ElementHandle {
		return this.adapter.getByLabel(LISTING_FLAG_LABELS[flag]);
	}

	/** Whether the listing flag switch is currently on (`aria-checked`). */
	async listingFlagState(flag: PropertyListingFlagKey): Promise<boolean> {
		return (await this.listingFlagSwitch(flag).getAttribute('aria-checked')) === 'true';
	}

	/** Toggle the listing flag switch until it reports the desired state. */
	async setListingFlag(flag: PropertyListingFlagKey, desired: boolean): Promise<void> {
		if ((await this.listingFlagState(flag)) !== desired) {
			await this.listingFlagSwitch(flag).click();
		}
	}

	/** Search input of the Owner member select (antd Select labelled "Owner"). */
	get ownerSelectInput(): ElementHandle {
		return this.adapter.getByLabel('Owner');
	}

	/** The rendered selection of the Owner select (antd `.ant-select-selection-item`, `.ant-select-content` since antd 6). */
	get ownerSelectedItem(): ElementHandle {
		return this.adapter.locator('.ant-select-selection-item, .ant-select-content[title]');
	}

	/** The dropdown option of the Owner select showing the given member name. */
	ownerOptionNamed(memberName: string): ElementHandle {
		return this.adapter.locator(`.ant-select-item-option[title="${memberName}"]`);
	}

	/** Open the Owner select dropdown. */
	async openOwnerSelect(): Promise<void> {
		await this.ownerSelectInput.click();
	}

	/** Click the Owner option showing the given member name. */
	async clickOwnerOption(memberName: string): Promise<void> {
		await this.ownerOptionNamed(memberName).click();
	}

	/** Member name currently shown by the Owner select, or empty when unset. */
	async selectedOwnerText(): Promise<string> {
		const title = await this.ownerSelectedItem.getAttribute('title');
		if (title) {
			return title.trim();
		}
		return ((await this.ownerSelectedItem.textContent()) ?? '').trim();
	}

	/** Add-row button of the "Bedroom Details" dynamic list. */
	get addBedroomDetailButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Add Bedroom Detail/i });
	}

	/** "Room Name" input of the first bedroom detail row. */
	get bedroomRoomNameInput(): ElementHandle {
		return this.adapter.getByLabel('Room Name');
	}

	/** "Bed Descriptions" input of the first bedroom detail row. */
	get bedroomBedDescriptionsInput(): ElementHandle {
		return this.adapter.getByLabel('Bed Descriptions');
	}

	/** Add-row button of the "Additional Amenities" dynamic list. */
	get addAdditionalAmenityButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Add Additional Amenity/i });
	}

	/** "Category" input of the first additional amenity row. */
	get additionalAmenityCategoryInput(): ElementHandle {
		return this.adapter.getByLabel('Category');
	}

	/** "Amenities" input of the first additional amenity row (id-resolved to avoid the section-level Amenities field). */
	get additionalAmenityAmenitiesInput(): ElementHandle {
		return this.adapter.locator('[id$="additionalAmenities_0_amenities"]');
	}

	/** The exact bathrooms increment validation message. */
	get bathroomsIncrementError(): ElementHandle {
		return this.adapter.getByText(/Bathrooms must be in increments of 0\.5/);
	}

	/** A section or subsection heading with the exact given text (Overview, Location, Listing, Details, Amenities, Media, Agent). */
	sectionHeading(name: string): ElementHandle {
		return this.adapter.getByText(new RegExp(`^${escapeRegExp(name)}$`));
	}

	/** A page header title with the exact given text (e.g. "Property Details"). */
	headerTitled(title: string): ElementHandle {
		return this.adapter.getByText(new RegExp(`^${escapeRegExp(title)}$`));
	}
}
