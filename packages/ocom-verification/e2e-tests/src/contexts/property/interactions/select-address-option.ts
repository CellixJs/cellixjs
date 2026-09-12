import type { PropertyAddressSelectFieldKey, PropertyFormPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Interaction, the } from '@serenity-js/core';
import { browserPageOf, propertyFormOn, waitUntil } from '../abilities/admin-portal-page.ts';

/** Address field labels shown on the property form. */
const ADDRESS_FIELD_LABELS: Record<PropertyAddressSelectFieldKey, string> = {
	country: 'Country',
	countrySubdivision: 'State',
};

/**
 * Pick an option in an address dropdown select that is already known to be a
 * combobox. Types into the search input when the option is not rendered yet
 * (long option lists may be virtualised).
 */
const pickAddressOption = async (formPage: PropertyFormPage, field: PropertyAddressSelectFieldKey, label: string): Promise<void> => {
	await formPage.openAddressSelect(field);
	if (!(await formPage.addressOptionLabelled(label).isVisible())) {
		await formPage.searchAddressOption(field, label);
	}
	await waitUntil(() => formPage.addressOptionLabelled(label).isVisible(), `Expected the ${ADDRESS_FIELD_LABELS[field]} dropdown to offer the option "${label}"`, 10_000);
	await formPage.clickAddressOption(label);
};

/**
 * Fill an address field that may be rendered as a plain text input (legacy
 * form) or as an antd Select dropdown. The select path picks the option whose
 * label corresponds to the stored value (state codes map to full names).
 */
export const fillAddressFieldOn = async (formPage: PropertyFormPage, field: PropertyAddressSelectFieldKey, value: string): Promise<void> => {
	if (!(await formPage.addressControlIsSelect(field))) {
		await formPage.fillField(field, value);
		return;
	}
	await pickAddressOption(formPage, field, formPage.addressOptionLabelFor(field, value));
};

/**
 * Low-level interaction that selects an option from an address dropdown on
 * the form currently on screen. Fails fast when the field is missing or is
 * not rendered as a dropdown select.
 */
export const SelectAddressDropdownOption = (field: PropertyAddressSelectFieldKey, label: string) =>
	Interaction.where(the`#actor selects "${label}" in the ${ADDRESS_FIELD_LABELS[field]} dropdown`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const formPage = propertyFormOn(browserPageOf(actor));

		try {
			await formPage.fieldInput(field).waitFor({ state: 'visible', timeout: 5_000 });
		} catch {
			throw new Error(`The property form does not show the "${ADDRESS_FIELD_LABELS[field]}" field`);
		}
		if (!(await formPage.addressControlIsSelect(field))) {
			throw new Error(`Expected the ${ADDRESS_FIELD_LABELS[field]} field to be a dropdown select, but it is not`);
		}
		await pickAddressOption(formPage, field, label);
	});
