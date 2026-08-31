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
 * "Listed For Lease") or substrings of rendered option labels (e.g. "State"
 * inside the "United States" country option) are resolved by control id
 * instead. The id must be the camelCase field key, optionally nested under a
 * form name path.
 */
const ID_RESOLVED_FIELDS: ReadonlySet<PropertyFormTextFieldKey> = new Set([
	'lease',
	'description',
	'amenities',
	'images',
	'floorPlan',
	'countrySubdivision',
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

/** Address fields that the admin form presents as dropdown selects. */
export type PropertyAddressSelectFieldKey = 'country' | 'countrySubdivision';

/** US state and district options offered by the State dropdown: 2-letter code (stored value) to full name (displayed label). */
export const US_STATE_OPTIONS: ReadonlyArray<{ code: string; name: string }> = [
	{ code: 'AL', name: 'Alabama' },
	{ code: 'AK', name: 'Alaska' },
	{ code: 'AZ', name: 'Arizona' },
	{ code: 'AR', name: 'Arkansas' },
	{ code: 'CA', name: 'California' },
	{ code: 'CO', name: 'Colorado' },
	{ code: 'CT', name: 'Connecticut' },
	{ code: 'DE', name: 'Delaware' },
	{ code: 'DC', name: 'District of Columbia' },
	{ code: 'FL', name: 'Florida' },
	{ code: 'GA', name: 'Georgia' },
	{ code: 'HI', name: 'Hawaii' },
	{ code: 'ID', name: 'Idaho' },
	{ code: 'IL', name: 'Illinois' },
	{ code: 'IN', name: 'Indiana' },
	{ code: 'IA', name: 'Iowa' },
	{ code: 'KS', name: 'Kansas' },
	{ code: 'KY', name: 'Kentucky' },
	{ code: 'LA', name: 'Louisiana' },
	{ code: 'ME', name: 'Maine' },
	{ code: 'MD', name: 'Maryland' },
	{ code: 'MA', name: 'Massachusetts' },
	{ code: 'MI', name: 'Michigan' },
	{ code: 'MN', name: 'Minnesota' },
	{ code: 'MS', name: 'Mississippi' },
	{ code: 'MO', name: 'Missouri' },
	{ code: 'MT', name: 'Montana' },
	{ code: 'NE', name: 'Nebraska' },
	{ code: 'NV', name: 'Nevada' },
	{ code: 'NH', name: 'New Hampshire' },
	{ code: 'NJ', name: 'New Jersey' },
	{ code: 'NM', name: 'New Mexico' },
	{ code: 'NY', name: 'New York' },
	{ code: 'NC', name: 'North Carolina' },
	{ code: 'ND', name: 'North Dakota' },
	{ code: 'OH', name: 'Ohio' },
	{ code: 'OK', name: 'Oklahoma' },
	{ code: 'OR', name: 'Oregon' },
	{ code: 'PA', name: 'Pennsylvania' },
	{ code: 'RI', name: 'Rhode Island' },
	{ code: 'SC', name: 'South Carolina' },
	{ code: 'SD', name: 'South Dakota' },
	{ code: 'TN', name: 'Tennessee' },
	{ code: 'TX', name: 'Texas' },
	{ code: 'UT', name: 'Utah' },
	{ code: 'VT', name: 'Vermont' },
	{ code: 'VA', name: 'Virginia' },
	{ code: 'WA', name: 'Washington' },
	{ code: 'WV', name: 'West Virginia' },
	{ code: 'WI', name: 'Wisconsin' },
	{ code: 'WY', name: 'Wyoming' },
];

/** Full state name displayed for a stored 2-letter code, or undefined for non-state values. */
export const stateNameForCode = (code: string): string | undefined => US_STATE_OPTIONS.find((option) => option.code === code)?.name;

/** Stored 2-letter code for a displayed state name, or undefined for non-state labels. */
export const stateCodeForName = (name: string): string | undefined => US_STATE_OPTIONS.find((option) => option.name === name)?.code;

/** Placement of a unit adornment on a number field. */
export type FieldAdornment = { placement: 'prefix' | 'suffix' | 'none'; text: string };

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

	/** The "Save & Close" button of the property detail form. */
	get saveAndCloseButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Save & Close/i });
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

	async clickSaveAndClose(): Promise<void> {
		await this.saveAndCloseButton.click();
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

	/**
	 * The antd Form.Item wrapper containing the given field's control, or null.
	 * Used to scope per-field decorations (inline errors, unit adornments,
	 * spinner controls, select content) without parent traversal.
	 */
	async formItemFor(field: PropertyFormTextFieldKey): Promise<ElementHandle | null> {
		const items = await this.adapter.locatorAll('.ant-form-item');
		for (const item of items) {
			if (await item.querySelector(`#${field}, [id$="_${field}"]`)) {
				return item;
			}
		}
		return null;
	}

	/** Inline validation error shown under the given field (antd `.ant-form-item-explain-error`), or null when absent. */
	async fieldInlineError(field: PropertyFormTextFieldKey): Promise<string | null> {
		const item = await this.formItemFor(field);
		if (!item) {
			return null;
		}
		const error = await item.querySelector('.ant-form-item-explain-error');
		if (!error) {
			return null;
		}
		return ((await error.textContent()) ?? '').trim();
	}

	/** Unit adornment rendered inside the given number field (antd InputNumber `prefix`/`suffix`). */
	async fieldAdornment(field: PropertyFormTextFieldKey): Promise<FieldAdornment> {
		const item = await this.formItemFor(field);
		if (!item) {
			return { placement: 'none', text: '' };
		}
		const prefix = await item.querySelector('.ant-input-number-prefix');
		if (prefix) {
			return { placement: 'prefix', text: ((await prefix.textContent()) ?? '').trim() };
		}
		const suffix = await item.querySelector('.ant-input-number-suffix');
		if (suffix) {
			return { placement: 'suffix', text: ((await suffix.textContent()) ?? '').trim() };
		}
		return { placement: 'none', text: '' };
	}

	/** Whether the given number field renders spinner (step) controls (antd 6 `.ant-input-number-actions`, antd 5 `.ant-input-number-handler-wrap`). */
	async fieldHasSpinnerControls(field: PropertyFormTextFieldKey): Promise<boolean> {
		const item = await this.formItemFor(field);
		if (!item) {
			return false;
		}
		return (await item.querySelector('.ant-input-number-actions, .ant-input-number-handler-wrap')) !== null;
	}

	/** Whether the given address field is rendered as an antd Select (combobox) rather than a text input. */
	async addressControlIsSelect(field: PropertyAddressSelectFieldKey): Promise<boolean> {
		return (await this.fieldInput(field).getAttribute('role')) === 'combobox';
	}

	/** Open the dropdown of the given address select field. */
	async openAddressSelect(field: PropertyAddressSelectFieldKey): Promise<void> {
		await this.fieldInput(field).click();
	}

	/** Type into the search input of an open address select to filter its options. */
	async searchAddressOption(field: PropertyAddressSelectFieldKey, text: string): Promise<void> {
		await this.fieldInput(field).fill(text);
	}

	/** The dropdown option showing the given label (antd option title). */
	addressOptionLabelled(label: string): ElementHandle {
		return this.adapter.locator(`.ant-select-item-option[title="${label}"]`);
	}

	/** Click the dropdown option showing the given label. */
	async clickAddressOption(label: string): Promise<void> {
		await this.addressOptionLabelled(label).click();
	}

	/** Dropdown option label the form displays for a stored address value (state codes map to full names). */
	addressOptionLabelFor(field: PropertyAddressSelectFieldKey, value: string): string {
		if (field === 'countrySubdivision') {
			return stateNameForCode(value) ?? value;
		}
		return value;
	}

	/**
	 * Displayed value of an address field, normalised to the stored form.
	 * Reads the text input value when the field is a plain input; reads the
	 * select's rendered selection (mapping state names back to 2-letter codes)
	 * when it is a dropdown select.
	 */
	async addressFieldDisplayValue(field: PropertyAddressSelectFieldKey): Promise<string> {
		if (!(await this.addressControlIsSelect(field))) {
			return await this.fieldValue(field);
		}
		const item = await this.formItemFor(field);
		if (!item) {
			return '';
		}
		const content = await item.querySelector('.ant-select-selection-item, .ant-select-content-has-value');
		if (!content) {
			return '';
		}
		const title = await content.getAttribute('title');
		const label = (title ?? (await content.textContent()) ?? '').trim();
		if (field === 'countrySubdivision') {
			return stateCodeForName(label) ?? label;
		}
		return label;
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
