import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { ACTIVE_COMMUNITY_ID, ensureMockProperty, resetPropertyUiState } from '../abilities/mock-property-backend.ts';
import { BaselinePropertyCount, LastPropertyMutation, MockedPropertyCount, ViewedPropertyCommunity } from '../questions/property-outcome.ts';
import {
	DetailPropertyNameValue,
	ListedPropertyNames,
	ManagePropertiesAllowed,
	PropertiesListIncludes,
	PropertyNoLongerRetrievable,
	PropertyRowCells,
	SuccessFeedbackVisible,
	ValidationErrorMatching,
} from '../questions/property-screen.ts';
import { CreatePropertyViaForm, DeletePropertyViaConfirm, type PropertyFormInput, UpdatePropertyViaForm } from '../tasks/manage-property.ts';
import { OpenPropertiesList, OpenPropertyDetail } from '../tasks/properties-screen.ts';

// Column order of the properties list table, used to read row cells.
const LIST_COLUMNS = { propertyName: 0, propertyType: 1, bedrooms: 3, bathrooms: 4, squareFeet: 5 } as const;

Given('{word} is an authenticated property manager of a community', (actorName: string) => {
	resetPropertyUiState();
	actorCalled(actorName);
});

Given('{word} has created a property named {string}', (_actorName: string, propertyName: string) => {
	ensureMockProperty(propertyName);
});

When('{word} creates a property named {string}', async (actorName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(CreatePropertyViaForm({ propertyName }));
});

When('{word} attempts to create a property with:', async (actorName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<PropertyFormInput>();
	await actorCalled(actorName).attemptsTo(CreatePropertyViaForm(details));
});

When('{word} views the properties list', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(OpenPropertiesList());
});

When('{word} views the details of the property {string}', async (actorName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(OpenPropertyDetail(propertyName));
});

When('{word} updates the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<PropertyFormInput>();
	await actorCalled(actorName).attemptsTo(UpdatePropertyViaForm(propertyName, details));
});

When('{word} deletes the property {string}', async (actorName: string, propertyName: string) => {
	await actorCalled(actorName).attemptsTo(DeletePropertyViaConfirm(propertyName));
});

Then('the property should be created successfully', async () => {
	const actor = actorInTheSpotlight();
	if (!(await actor.answer(SuccessFeedbackVisible()))) {
		throw new Error('Expected a success message after creating the property');
	}
	const mutation = await actor.answer(LastPropertyMutation());
	const baselineCount = await actor.answer(BaselinePropertyCount());
	const currentCount = await actor.answer(MockedPropertyCount());
	if (mutation?.success !== true || baselineCount === undefined || currentCount !== baselineCount + 1) {
		throw new Error('Expected the property create mutation to succeed and persist exactly one new property');
	}
});

Then('the property should be updated successfully', async () => {
	const actor = actorInTheSpotlight();
	if (!(await actor.answer(SuccessFeedbackVisible()))) {
		throw new Error('Expected a success message after updating the property');
	}
	const mutation = await actor.answer(LastPropertyMutation());
	if (mutation?.success !== true) {
		throw new Error('Expected the property update mutation to succeed');
	}
});

Then('the property should be deleted successfully', async () => {
	const actor = actorInTheSpotlight();
	if (!(await actor.answer(SuccessFeedbackVisible()))) {
		throw new Error('Expected a success message after deleting the property');
	}
	const mutation = await actor.answer(LastPropertyMutation());
	if (mutation?.success !== true) {
		throw new Error('Expected the property delete mutation to succeed');
	}
});

Then('the properties list should include {string}', async (propertyName: string) => {
	if (!(await actorInTheSpotlight().answer(PropertiesListIncludes(propertyName)))) {
		throw new Error(`Expected the properties list to include "${propertyName}"`);
	}
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

Then("the viewed property should belong to {word}'s community", async (_ownerName: string) => {
	const actualCommunityId = await actorInTheSpotlight().answer(ViewedPropertyCommunity());
	if (actualCommunityId !== ACTIVE_COMMUNITY_ID) {
		throw new Error(`Expected the viewed property to belong to community "${ACTIVE_COMMUNITY_ID}" but it belongs to "${actualCommunityId}"`);
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
	if (!(await actorInTheSpotlight().answer(PropertyNoLongerRetrievable(propertyName)))) {
		throw new Error(`Expected the property "${propertyName}" to no longer be retrievable after deletion, but its details still render`);
	}
});

Then("{word}'s member role should allow managing properties", async (actorName: string) => {
	if (!(await actorCalled(actorName).answer(ManagePropertiesAllowed()))) {
		throw new Error(`Expected ${actorName}'s member role to grant the manage-properties permission, but the properties section is not accessible`);
	}
});

Then('{word} should see a property error for {string}', async (_actorName: string, fieldName: string) => {
	const expectedPattern = fieldName === 'propertyName' ? /property name/i : new RegExp(fieldName, 'i');
	if (!(await actorInTheSpotlight().answer(ValidationErrorMatching(expectedPattern)))) {
		throw new Error(`Expected a property error for "${fieldName}"`);
	}
});

Then('no property should be created', async () => {
	const actor = actorInTheSpotlight();
	const baselineCount = await actor.answer(BaselinePropertyCount());
	if (baselineCount === undefined) {
		throw new Error('No baseline property count was recorded. Did the actor attempt to create a property first?');
	}
	const currentCount = await actor.answer(MockedPropertyCount());
	if (currentCount !== baselineCount) {
		throw new Error(`Expected no property to be created, but the property count changed from ${baselineCount} to ${currentCount}`);
	}
});
