import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import type { PropertyFormFields } from '../interactions/fill-property-form.ts';
import {
	BaselinePropertyNames,
	DetailPropertyNameValue,
	LastPropertyError,
	LastPropertyStatus,
	ListedPropertyNames,
	ManagePropertiesAllowed,
	PropertiesListIncludes,
	PropertyNoLongerRetrievable,
	PropertyRowCells,
	ValidationErrorMatching,
	ViewedPropertyInManagedCommunity,
} from '../questions/property-screen.ts';
import { BecomePropertyManager } from '../tasks/become-property-manager.ts';
import { CreatePropertyViaForm } from '../tasks/create-property.ts';
import { DeletePropertyViaConfirm } from '../tasks/delete-property.ts';
import { EnsurePropertyExists } from '../tasks/ensure-property-exists.ts';
import { UpdatePropertyViaForm } from '../tasks/update-property.ts';
import { ViewPropertiesList } from '../tasks/view-properties-list.ts';
import { ViewPropertyDetails } from '../tasks/view-property-details.ts';

// Column order of the properties list table, used to read row cells.
const LIST_COLUMNS = { propertyName: 0, propertyType: 1, bedrooms: 3, bathrooms: 4, squareFeet: 5 } as const;

Given('{word} is an authenticated property manager of a community', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(BecomePropertyManager());
});

Given('{word} has created a property named {string}', async (actorName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(EnsurePropertyExists(propertyName));
});

When('{word} creates a property named {string}', async (actorName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(CreatePropertyViaForm({ propertyName }));
});

When('{word} attempts to create a property with:', async (actorName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<PropertyFormFields>();
	await actorCalled(actorName).attemptsTo(CreatePropertyViaForm(details));
});

When('{word} views the properties list', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(ViewPropertiesList());
});

When('{word} views the details of the property {string}', async (actorName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(ViewPropertyDetails(propertyName));
});

When('{word} updates the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<PropertyFormFields>();
	await actorCalled(actorName).attemptsTo(UpdatePropertyViaForm(propertyName, details));
});

When('{word} deletes the property {string}', async (actorName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(DeletePropertyViaConfirm(propertyName));
});

async function expectLastOperationSucceeded(operation: string): Promise<void> {
	const actor = actorInTheSpotlight();
	const status = await actor.answer(LastPropertyStatus());
	if (status !== 'SUCCESS') {
		const capturedError = await actor.answer(LastPropertyError());
		throw new Error(`Expected the property to be ${operation} successfully but status was "${status}"${capturedError ? `: ${capturedError}` : ''}`);
	}
}

Then('the property should be created successfully', async () => {
	await expectLastOperationSucceeded('created');
});

Then('the property should be updated successfully', async () => {
	await expectLastOperationSucceeded('updated');
});

Then('the property should be deleted successfully', async () => {
	await expectLastOperationSucceeded('deleted');
});

Then('the properties list should include {string}', async (propertyName: string) => {
	await actorInTheSpotlight().answer(PropertiesListIncludes(propertyName));
});

Then('the properties list should not include {string}', async (propertyName: string) => {
	const listed = await actorInTheSpotlight().answer(ListedPropertyNames());
	if (listed.includes(propertyName)) {
		throw new Error(`Expected the properties list to not include "${propertyName}", but it lists: ${listed.map((name) => `"${name}"`).join(', ')}`);
	}
});

Then('she should see the property name {string}', async (expectedName: string) => {
	const actualName = await actorInTheSpotlight().answer(DetailPropertyNameValue());
	if (actualName !== expectedName) {
		throw new Error(`Expected the viewed property name to be "${expectedName}" but got "${actualName}"`);
	}
});

Then("the viewed property should belong to {word}'s community", async (ownerName: string) => {
	if (!(await actorCalled(ownerName).answer(ViewedPropertyInManagedCommunity()))) {
		throw new Error(`Expected the viewed property to belong to ${ownerName}'s community, but the detail page is outside their admin portal`);
	}
});

Then('the property {string} should have the property type {string}', async (propertyName: string, expectedType: string) => {
	const cells = await actorInTheSpotlight().answer(PropertyRowCells(propertyName));
	const actualType = cells?.[LIST_COLUMNS.propertyType];
	if (actualType !== expectedType) {
		throw new Error(`Expected the property "${propertyName}" to have property type "${expectedType}" but got "${actualType}"`);
	}
});

Then('the property {string} should have {float} bedrooms, {float} bathrooms, and {float} square feet', async (propertyName: string, bedrooms: number, bathrooms: number, squareFeet: number) => {
	const cells = await actorInTheSpotlight().answer(PropertyRowCells(propertyName));
	const expectations: ReadonlyArray<[string, number, string | undefined]> = [
		['bedrooms', bedrooms, cells?.[LIST_COLUMNS.bedrooms]],
		['bathrooms', bathrooms, cells?.[LIST_COLUMNS.bathrooms]],
		['square feet', squareFeet, cells?.[LIST_COLUMNS.squareFeet]],
	];
	for (const [field, expected, actual] of expectations) {
		if (actual !== String(expected)) {
			throw new Error(`Expected the property "${propertyName}" to show ${expected} ${field} but got "${actual}"`);
		}
	}
});

Then('the property {string} should no longer be retrievable', async (propertyName: string) => {
	await actorInTheSpotlight().answer(PropertyNoLongerRetrievable(propertyName));
});

Then("{word}'s member role should allow managing properties", async (actorName: string) => {
	if (!(await actorCalled(actorName).answer(ManagePropertiesAllowed()))) {
		throw new Error(`Expected ${actorName}'s member role to grant the manage-properties permission, but the properties section is not accessible`);
	}
});

Then('{word} should see a property error for {string}', async (_actorName: string, fieldName: string) => {
	const expectedPattern = fieldName === 'propertyName' ? /property name/i : new RegExp(fieldName, 'i');
	await actorInTheSpotlight().answer(ValidationErrorMatching(expectedPattern));
});

Then('no property should be created', async () => {
	const actor = actorInTheSpotlight();
	const baseline = await actor.answer(BaselinePropertyNames());
	if (baseline === undefined) {
		throw new Error('No baseline property names were recorded. Did the actor attempt to create a property first?');
	}
	const listed = await actor.answer(ListedPropertyNames());
	if (listed.length !== baseline.length) {
		throw new Error(`Expected no property to be created, but the property count changed from ${baseline.length} to ${listed.length}`);
	}
});
