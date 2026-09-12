import { type Actor, Interaction, the } from '@serenity-js/core';
import { browserPageOf, propertyFormOn } from '../abilities/admin-portal-page.ts';

/**
 * Low-level interaction that adds a bedroom detail row on the form currently
 * on screen and fills its fields. Fails fast when the form does not render
 * the Bedroom Details list yet.
 */
export const AddBedroomDetailRow = (roomName: string, bedDescriptions: string) =>
	Interaction.where(the`#actor adds the bedroom detail "${roomName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const formPage = propertyFormOn(browserPageOf(actor));

		try {
			await formPage.addBedroomDetailButton.waitFor({ state: 'visible', timeout: 5_000 });
		} catch {
			throw new Error('The property form does not show an "Add Bedroom Detail" button');
		}
		await formPage.addBedroomDetailButton.click();
		try {
			await formPage.bedroomRoomNameInput.waitFor({ state: 'visible', timeout: 5_000 });
		} catch {
			throw new Error('Adding a bedroom detail row did not render a "Room Name" input');
		}
		await formPage.bedroomRoomNameInput.fill(roomName);
		await formPage.bedroomBedDescriptionsInput.fill(bedDescriptions);
	});

/**
 * Low-level interaction that adds an additional amenity category row on the
 * form currently on screen and fills its fields. Fails fast when the form
 * does not render the Additional Amenities list yet.
 */
export const AddAdditionalAmenityRow = (category: string, amenities: string) =>
	Interaction.where(the`#actor adds the additional amenity category "${category}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const formPage = propertyFormOn(browserPageOf(actor));

		try {
			await formPage.addAdditionalAmenityButton.waitFor({ state: 'visible', timeout: 5_000 });
		} catch {
			throw new Error('The property form does not show an "Add Additional Amenity" button');
		}
		await formPage.addAdditionalAmenityButton.click();
		try {
			await formPage.additionalAmenityCategoryInput.waitFor({ state: 'visible', timeout: 5_000 });
		} catch {
			throw new Error('Adding an additional amenity row did not render a "Category" input');
		}
		await formPage.additionalAmenityCategoryInput.fill(category);
		await formPage.additionalAmenityAmenitiesInput.fill(amenities);
	});
