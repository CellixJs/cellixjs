import { type Actor, Interaction, the } from '@serenity-js/core';
import { browserPageOf, propertyFormOn } from '../abilities/admin-portal-page.ts';

/** Field values accepted by the property create and detail forms. */
export interface PropertyFormFields {
	propertyName?: string;
	propertyType?: string;
	bedrooms?: string;
	bathrooms?: string;
	squareFeet?: string;
}

/**
 * Low-level interaction that fills the property form fields currently on
 * screen. Only the provided fields are touched, so it works for both the
 * create form and the detail form.
 */
export const FillPropertyForm = (fields: PropertyFormFields) =>
	Interaction.where(the`#actor fills the property form`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const formPage = propertyFormOn(browserPageOf(actor));
		if (fields.propertyName !== undefined) {
			await formPage.fillPropertyName(fields.propertyName);
		}
		if (fields.propertyType !== undefined) {
			await formPage.fillPropertyType(fields.propertyType);
		}
		if (fields.bedrooms !== undefined) {
			await formPage.fillBedrooms(Number(fields.bedrooms));
		}
		if (fields.bathrooms !== undefined) {
			await formPage.fillBathrooms(Number(fields.bathrooms));
		}
		if (fields.squareFeet !== undefined) {
			await formPage.fillSquareFeet(Number(fields.squareFeet));
		}
	});
