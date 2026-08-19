import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import type { PropertyFormFields } from '../interactions/fill-property-form.ts';
import type { PropertyE2ENotes } from '../notes/property-notes.ts';
import {
	AdditionalAmenityRowValues,
	BathroomsIncrementMessageVisible,
	BedroomDetailRowValues,
	DetailFormFieldMismatches,
	ListCellInColumn,
	OnPropertiesListNow,
	PageTitledVisible,
	SelectedOwnerName,
} from '../questions/property-fields-screen.ts';
import { LastPropertyStatus } from '../questions/property-screen.ts';
import {
	AddAdditionalAmenityViaForm,
	AddBedroomDetailViaForm,
	CreatePropertyWithFullFieldsViaForm,
	SaveAndClosePropertyViaForm,
	SelectAddressDropdownsViaForm,
	SetPropertyOwnerViaForm,
	UpdatePropertyFieldsViaForm,
} from '../tasks/manage-property-fields.ts';
import { UpdatePropertyViaForm } from '../tasks/update-property.ts';

/** Member name the seeded community owner is provisioned with. */
const OWN_MEMBER_NAME = `${actors.CommunityOwner.givenName} ${actors.CommunityOwner.familyName}`;

const normalizeList = (value: string): string =>
	value
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part.length > 0)
		.join(', ');

async function expectNoFieldMismatches(propertyName: string, expected: Record<string, string>): Promise<void> {
	const mismatches = await actorInTheSpotlight().answer(DetailFormFieldMismatches(propertyName, expected));
	if (mismatches.length > 0) {
		throw new Error(`The detail form of "${propertyName}" does not show the expected field values:\n${mismatches.join('\n')}`);
	}
}

When('{word} creates a property with the full field set:', async (actorName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<PropertyE2ENotes>().set('submittedPropertyFields', details), CreatePropertyWithFullFieldsViaForm(details));
});

Then('{word} should land back on the properties list', async (actorName: string) => {
	if (!(await actorCalled(actorName).answer(OnPropertiesListNow()))) {
		throw new Error('Expected the create flow to navigate back to the properties list');
	}
});

Then('the property {string} should record the full field set', async (propertyName: string) => {
	const submitted = await actorInTheSpotlight().answer(notes<PropertyE2ENotes>().get('submittedPropertyFields'));
	if (!submitted || Object.keys(submitted).length === 0) {
		throw new Error('No submitted property field set was recorded for this scenario');
	}
	await expectNoFieldMismatches(propertyName, submitted);
});

When('{word} updates the address of the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	await actorCalled(actorName).attemptsTo(UpdatePropertyFieldsViaForm(propertyName, details, 'updates the address'));
});

When('{word} selects the state {string} and country {string} of the property {string} from dropdowns', async (actorName: string, stateName: string, countryName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(SelectAddressDropdownsViaForm(propertyName, stateName, countryName));
});

When('{word} saves and closes the property {string} after setting {string} to {string}', async (actorName: string, propertyName: string, field: string, value: string) => {
	await actorCalled(actorName).attemptsTo(SaveAndClosePropertyViaForm(propertyName, { [field]: value }));
});

Then('the property {string} should have the address:', async (propertyName: string, dataTable: DataTable) => {
	await expectNoFieldMismatches(propertyName, GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>());
});

When('{word} sets the owner of the property {string} to their own member', async (actorName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(SetPropertyOwnerViaForm(propertyName, OWN_MEMBER_NAME));
});

Then("the property {string} should be owned by {word}'s member", async (propertyName: string, _ownerActorName: string) => {
	const selectedOwner = await actorInTheSpotlight().answer(SelectedOwnerName(propertyName));
	if (selectedOwner !== OWN_MEMBER_NAME) {
		throw new Error(`Expected the owner of "${propertyName}" to be "${OWN_MEMBER_NAME}" but the form shows "${selectedOwner}"`);
	}
});

When('{word} updates the listing details of the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	await actorCalled(actorName).attemptsTo(UpdatePropertyFieldsViaForm(propertyName, details, 'updates the listing details'));
});

Then('the property {string} should have the listing details:', async (propertyName: string, dataTable: DataTable) => {
	await expectNoFieldMismatches(propertyName, GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>());
});

When('{word} updates the amenities of the property {string} to {string}', async (actorName: string, propertyName: string, amenities: string) => {
	await actorCalled(actorName).attemptsTo(UpdatePropertyFieldsViaForm(propertyName, { amenities }, 'updates the amenities'));
});

When('{word} adds an additional amenity category {string} with amenities {string} to the property {string}', async (actorName: string, category: string, amenities: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(AddAdditionalAmenityViaForm(propertyName, category, amenities));
});

Then('the property {string} should have the amenities {string}', async (propertyName: string, amenities: string) => {
	await expectNoFieldMismatches(propertyName, { amenities });
});

Then('the property {string} should have an additional amenity category {string} with amenities {string}', async (propertyName: string, category: string, amenities: string) => {
	const row = await actorInTheSpotlight().answer(AdditionalAmenityRowValues(propertyName));
	if (row.category !== category || normalizeList(row.amenities) !== normalizeList(amenities)) {
		throw new Error(`Expected the additional amenity row of "${propertyName}" to show category "${category}" with amenities "${amenities}" but the form shows category "${row.category}" with amenities "${row.amenities}"`);
	}
});

When('{word} adds a bedroom detail with room name {string} and bed descriptions {string} to the property {string}', async (actorName: string, roomName: string, bedDescriptions: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(AddBedroomDetailViaForm(propertyName, roomName, bedDescriptions));
});

Then('the property {string} should have a bedroom detail with room name {string} and bed descriptions {string}', async (propertyName: string, roomName: string, bedDescriptions: string) => {
	const row = await actorInTheSpotlight().answer(BedroomDetailRowValues(propertyName));
	if (row.roomName !== roomName || normalizeList(row.bedDescriptions) !== normalizeList(bedDescriptions)) {
		throw new Error(
			`Expected the bedroom detail row of "${propertyName}" to show room name "${roomName}" with bed descriptions "${bedDescriptions}" but the form shows room name "${row.roomName}" with bed descriptions "${row.bedDescriptions}"`,
		);
	}
});

When('{word} updates the media of the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	await actorCalled(actorName).attemptsTo(UpdatePropertyFieldsViaForm(propertyName, details, 'updates the media links'));
});

Then('the property {string} should have the media links:', async (propertyName: string, dataTable: DataTable) => {
	await expectNoFieldMismatches(propertyName, GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>());
});

When('{word} updates the listing agent of the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	await actorCalled(actorName).attemptsTo(UpdatePropertyFieldsViaForm(propertyName, details, 'updates the listing agent details'));
});

Then('the property {string} should have the listing agent details:', async (propertyName: string, dataTable: DataTable) => {
	await expectNoFieldMismatches(propertyName, GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>());
});

Then('the property {string} should have {float} bathrooms', async (propertyName: string, bathrooms: number) => {
	const cell = await actorInTheSpotlight().answer(ListCellInColumn(propertyName, 'Bathrooms'));
	if (cell === undefined || Number(cell) !== bathrooms) {
		throw new Error(`Expected the property "${propertyName}" to show ${bathrooms} bathrooms but the list shows "${cell}"`);
	}
});

When('{word} attempts to update the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<PropertyFormFields>();
	await actorCalled(actorName).attemptsTo(UpdatePropertyViaForm(propertyName, details));
});

Then('she should see the bathrooms increment validation message', async () => {
	if (!(await actorInTheSpotlight().answer(BathroomsIncrementMessageVisible()))) {
		throw new Error('Expected the form to show the validation message "Bathrooms must be in increments of 0.5"');
	}
});

Then('the property {string} should not have been saved', async (propertyName: string) => {
	const status = await actorInTheSpotlight().answer(LastPropertyStatus());
	if (status === 'SUCCESS') {
		throw new Error(`Expected the property "${propertyName}" to not have been saved, but the save reported success`);
	}
});

Then('the properties list should show {string} in the {string} column of {string}', async (expectedText: string, columnTitle: string, propertyName: string) => {
	const cell = await actorInTheSpotlight().answer(ListCellInColumn(propertyName, columnTitle));
	if (cell !== expectedText) {
		throw new Error(`Expected the "${columnTitle}" column of "${propertyName}" to show "${expectedText}" but got "${cell}"`);
	}
});

Then("the properties list should show {word}'s member name in the {string} column of {string}", async (_ownerActorName: string, columnTitle: string, propertyName: string) => {
	const cell = await actorInTheSpotlight().answer(ListCellInColumn(propertyName, columnTitle));
	if (cell !== OWN_MEMBER_NAME) {
		throw new Error(`Expected the "${columnTitle}" column of "${propertyName}" to show the member name "${OWN_MEMBER_NAME}" but got "${cell}"`);
	}
});

Then('the property page title should read {string}', async (title: string) => {
	if (!(await actorInTheSpotlight().answer(PageTitledVisible(title)))) {
		throw new Error(`Expected the property page title to read "${title}"`);
	}
});
