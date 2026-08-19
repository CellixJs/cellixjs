import { ActorName } from '@cellix/serenity-framework/cucumber/actor-name';
import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { type Actor, actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import { setActorToken, userTokenFor } from '../../../shared/abilities/actor-auth.ts';
import type { PropertyNotes, PropertyUpdateDetails } from '../notes/property-notes.ts';
import { PropertiesList } from '../questions/properties-list.ts';
import { PropertyField } from '../questions/property-field.ts';
import { PropertyManagerPermission } from '../questions/property-manager-permission.ts';
import { PropertyNamed } from '../questions/property-named.ts';
import { LastPropertyId, PropertyOperationError, PropertyOperationStatus } from '../questions/property-operation-outcome.ts';
import { PropertyRetrievable } from '../questions/property-retrievable.ts';
import { ViewedProperty } from '../questions/viewed-property.ts';
import { AttemptCreateProperty } from '../tasks/attempt-create-property.ts';
import { AttemptDeleteProperty } from '../tasks/attempt-delete-property.ts';
import { AttemptUpdateProperty } from '../tasks/attempt-update-property.ts';
import { BecomeDeactivatedPropertyManager } from '../tasks/become-deactivated-property-manager.ts';
import { BecomePropertyManager } from '../tasks/become-property-manager.ts';
import { CreateProperty } from '../tasks/create-property.ts';
import { DeleteProperty } from '../tasks/delete-property.ts';
import { BecomeResidentMember } from '../tasks/provision-resident-member.ts';
import { UpdateProperty } from '../tasks/update-property.ts';
import { ViewPropertiesList } from '../tasks/view-properties-list.ts';
import { ViewPropertyDetails } from '../tasks/view-property-details.ts';

let lastActorName = actors.CommunityOwner.name;
/** Community the current scenario's property manager set up; residents join it. */
let managedCommunityId: string | undefined;
/** Property ids created during the current scenario, keyed by property name. */
const scenarioPropertyIds = new Map<string, string>();

const errorMessageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * GraphQL schema-validation failures mean the property API does not exist yet.
 * Rejection assertions must treat those as test failures rather than business
 * rejections, otherwise negative scenarios would pass without a backend.
 */
const SCHEMA_LEVEL_ERROR = /cannot query field|unknown argument|unknown type|is not defined by type/i;

const clearPropertyOutcomeNotes = (actor: Actor) =>
	actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyStatus', undefined as unknown as string), notes<PropertyNotes>().set('lastPropertyError', undefined as unknown as string));

async function resolvePropertyId(actor: Actor, propertyName: string): Promise<string> {
	const knownId = scenarioPropertyIds.get(propertyName);
	if (knownId) {
		return knownId;
	}
	const property = await actor.answer(PropertyNamed.called(propertyName));
	if (property?.id) {
		return property.id;
	}
	throw new Error(`No property named "${propertyName}" is known in this scenario. Did an actor create it first?`);
}

function toPropertyUpdateDetails(dataTable: DataTable): PropertyUpdateDetails {
	const raw = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	// An empty table cell means "clear this value" and maps to an explicit null.
	const numericOrNull = (value: string | undefined): number | null | undefined => {
		if (value === undefined) {
			return undefined;
		}
		return value.trim() === '' ? null : Number(value);
	};
	return {
		propertyName: raw['propertyName'],
		propertyType: raw['propertyType'] === undefined ? undefined : raw['propertyType'].trim() === '' ? null : raw['propertyType'],
		bedrooms: numericOrNull(raw['bedrooms']),
		bathrooms: numericOrNull(raw['bathrooms']),
		squareFeet: numericOrNull(raw['squareFeet']),
	};
}

async function becomePropertyManager(actorName: string, tokenActorName: string = actors.CommunityOwner.name): Promise<void> {
	lastActorName = actorName;
	setActorToken(actorName, userTokenFor(tokenActorName));
	const actor = actorCalled(actorName);
	await actor.attemptsTo(BecomePropertyManager.ofANewCommunity());
	managedCommunityId = await actor.answer(notes<PropertyNotes>().get('activeCommunityId'));
}

async function createProperty(actorName: string, propertyName: string): Promise<void> {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(CreateProperty.named(propertyName));
	const propertyId = await actor.answer(notes<PropertyNotes>().get('lastPropertyId'));
	scenarioPropertyIds.set(propertyName, propertyId);
}

Given('{word} is an authenticated property manager of a community', async (actorName: string) => {
	scenarioPropertyIds.clear();
	await becomePropertyManager(actorName);
});

Given('{word} is an authenticated property manager of a separate community', async (actorName: string) => {
	await becomePropertyManager(actorName, actors.OtherCommunityOwner.name);
});

Given('{word} is a resident member of the same community without property permissions', async (actorName: string) => {
	if (!managedCommunityId) {
		throw new Error('No managed community found. Arrange a property manager before adding a resident member.');
	}
	setActorToken(actorName, userTokenFor(actors.CommunityMember.name));
	await actorCalled(actorName).attemptsTo(BecomeResidentMember.ofCommunity(managedCommunityId));
});

Given('{word} is a deactivated property manager of the same community', async (actorName: string) => {
	if (!managedCommunityId) {
		throw new Error('No managed community found. Arrange a property manager before adding a deactivated property manager.');
	}
	setActorToken(actorName, userTokenFor(actors.OtherCommunityOwner.name));
	await actorCalled(actorName).attemptsTo(BecomeDeactivatedPropertyManager.ofCommunity(managedCommunityId));
});

Given('{word} has created a property named {string}', createProperty);

When('{word} creates a property named {string}', createProperty);

When('{word} becomes the property manager of a different community', async (actorName: string) => {
	// Capture the community being left behind so scenarios can prove reads against it are rejected.
	const actor = actorCalled(actorName);
	const originalCommunityId = await actor.answer(notes<PropertyNotes>().get('activeCommunityId'));
	await becomePropertyManager(actorName);
	await actor.attemptsTo(notes<PropertyNotes>().set('previousCommunityId', originalCommunityId));
});

When('{word} attempts to view the properties list of their original community', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const communityId = await actor.answer(notes<PropertyNotes>().get('previousCommunityId'));
	await clearPropertyOutcomeNotes(actor);
	try {
		await actor.attemptsTo(ViewPropertiesList.ofCommunity(communityId));
	} catch (error) {
		await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyError', errorMessageOf(error)));
	}
});

When('{word} attempts to create a property named {string}', async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(AttemptCreateProperty.named(propertyName));
});

When('{word} attempts to create a property with:', async (actorName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const details = GherkinDataTable.from(dataTable).rowsHash<{ propertyName?: string }>();
	await actorCalled(actorName).attemptsTo(AttemptCreateProperty.named(details.propertyName ?? ''));
});

When('{word} views the properties list', async (actorName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(ViewPropertiesList.displayed());
});

When("{word} attempts to view the properties list of {word}'s community", async (actorName: string, ownerName: string) => {
	const communityId = await actorCalled(ownerName).answer(notes<PropertyNotes>().get('activeCommunityId'));
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await clearPropertyOutcomeNotes(actor);
	try {
		await actor.attemptsTo(ViewPropertiesList.ofCommunity(communityId));
	} catch (error) {
		await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyError', errorMessageOf(error)));
	}
});

When('{word} views the details of the property {string}', async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(ViewPropertyDetails.of(propertyName, propertyId));
});

When('{word} attempts to view the details of the property {string}', async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await clearPropertyOutcomeNotes(actor);
	try {
		await actor.attemptsTo(ViewPropertyDetails.of(propertyName, propertyId));
	} catch (error) {
		await actor.attemptsTo(notes<PropertyNotes>().set('lastPropertyError', errorMessageOf(error)));
	}
});

When('{word} updates the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	const details = toPropertyUpdateDetails(dataTable);
	await actor.attemptsTo(UpdateProperty.of(propertyName, propertyId, details));
	if (details.propertyName && details.propertyName !== propertyName) {
		scenarioPropertyIds.set(details.propertyName, propertyId);
	}
});

When('{word} attempts to update the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(AttemptUpdateProperty.of(propertyName, propertyId, toPropertyUpdateDetails(dataTable)));
});

When('{word} deletes the property {string}', async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(DeleteProperty.of(propertyName, propertyId));
});

When('{word} attempts to delete the property {string}', async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(AttemptDeleteProperty.of(propertyName, propertyId));
});

Then('the property should be created successfully', async () => {
	await expectLastOperationSucceeded('created');
});

Then('the property should be updated successfully', async () => {
	await expectLastOperationSucceeded('updated');
});

Then('the property should be deleted successfully', async () => {
	await expectLastOperationSucceeded('deleted');
});

async function expectLastOperationSucceeded(operation: string): Promise<void> {
	const actor = actorCalled(lastActorName);
	const status = await actor.answer(PropertyOperationStatus.of());
	if (status !== 'SUCCESS') {
		const capturedError = await actor.answer(PropertyOperationError.captured());
		throw new Error(`Expected the property to be ${operation} successfully but status was "${status}"${capturedError ? `: ${capturedError}` : ''}`);
	}
}

Then('the properties list should include {string}', async (propertyName: string) => {
	await expectListedProperty(actorCalled(lastActorName), propertyName, true);
});

Then('the properties list should not include {string}', async (propertyName: string) => {
	await expectListedProperty(actorCalled(lastActorName), propertyName, false);
});

Then('{word} should see a property named {string} in the properties list', async (actorName: string, propertyName: string) => {
	await expectListedProperty(actorCalled(actorName), propertyName, true);
});

Then('{word} should not see a property named {string} in the properties list', async (actorName: string, propertyName: string) => {
	await expectListedProperty(actorCalled(actorName), propertyName, false);
});

async function expectListedProperty(actor: Actor, propertyName: string, expected: boolean): Promise<void> {
	const properties = await actor.answer(PropertiesList.displayed());
	const listed = properties.some((property) => property.propertyName === propertyName);
	if (listed !== expected) {
		const names = properties.map((property) => `"${property.propertyName}"`).join(', ') || 'none';
		throw new Error(`Expected the properties list to ${expected ? 'include' : 'not include'} "${propertyName}", but it lists: ${names}`);
	}
}

Then('she should see the property name {string}', async (expectedName: string) => {
	const actualName = await actorInTheSpotlight().answer(ViewedProperty.propertyName());
	if (actualName !== expectedName) {
		throw new Error(`Expected the viewed property name to be "${expectedName}" but got "${actualName}"`);
	}
});

Then("the viewed property should belong to {word}'s community", async (ownerName: string) => {
	const expectedCommunityId = await actorCalled(ownerName).answer(notes<PropertyNotes>().get('activeCommunityId'));
	const actualCommunityId = await actorCalled(ownerName).answer(ViewedProperty.communityId());
	if (actualCommunityId !== expectedCommunityId) {
		throw new Error(`Expected the viewed property to belong to community "${expectedCommunityId}" but it belongs to "${actualCommunityId}"`);
	}
});

Then('the property {string} should have the property type {string}', async (propertyName: string, expectedType: string) => {
	const actualType = await actorCalled(lastActorName).answer(PropertyField.propertyType(propertyName));
	if (actualType !== expectedType) {
		throw new Error(`Expected the property "${propertyName}" to have property type "${expectedType}" but got "${actualType}"`);
	}
});

Then('the property {string} should have {float} bedrooms, {float} bathrooms, and {float} square feet', async (propertyName: string, bedrooms: number, bathrooms: number, squareFeet: number) => {
	const actor = actorCalled(lastActorName);
	const expectations: ReadonlyArray<[string, number, string | number | null]> = [
		['bedrooms', bedrooms, await actor.answer(PropertyField.bedrooms(propertyName))],
		['bathrooms', bathrooms, await actor.answer(PropertyField.bathrooms(propertyName))],
		['square feet', squareFeet, await actor.answer(PropertyField.squareFeet(propertyName))],
	];
	for (const [field, expected, actual] of expectations) {
		if (actual !== expected) {
			throw new Error(`Expected the property "${propertyName}" to have ${expected} ${field} but got ${actual}`);
		}
	}
});

Then('the property {string} should have no property type recorded', async (propertyName: string) => {
	const actualType = await actorCalled(lastActorName).answer(PropertyField.propertyType(propertyName));
	if (actualType !== null) {
		throw new Error(`Expected the property "${propertyName}" to have no property type recorded but got "${actualType}"`);
	}
});

Then('the property {string} should have no bedrooms, bathrooms, or square feet recorded', async (propertyName: string) => {
	const actor = actorCalled(lastActorName);
	const readings: ReadonlyArray<[string, string | number | null]> = [
		['bedrooms', await actor.answer(PropertyField.bedrooms(propertyName))],
		['bathrooms', await actor.answer(PropertyField.bathrooms(propertyName))],
		['square feet', await actor.answer(PropertyField.squareFeet(propertyName))],
	];
	for (const [field, actual] of readings) {
		if (actual !== null) {
			throw new Error(`Expected the property "${propertyName}" to have no ${field} recorded but got ${actual}`);
		}
	}
});

Then('the property {string} should no longer be retrievable', async (propertyName: string) => {
	const propertyId = scenarioPropertyIds.get(propertyName);
	if (!propertyId) {
		throw new Error(`No property named "${propertyName}" was created in this scenario, so retrievability cannot be checked`);
	}
	const retrievable = await actorCalled(lastActorName).answer(PropertyRetrievable.byId(propertyId));
	if (retrievable) {
		throw new Error(`Expected the property "${propertyName}" (${propertyId}) to no longer be retrievable after deletion, but it still is`);
	}
});

Then("{word}'s member role should allow managing properties", async (actorName: string) => {
	const granted = await actorCalled(actorName).answer(PropertyManagerPermission.granted());
	if (!granted) {
		throw new Error(`Expected ${actorName}'s member role to grant the manage-properties permission, but it does not`);
	}
});

Then('the property operation should be rejected', async () => {
	await expectRejectedOperation();
});

Then('the property error message should be exactly {string}', async (expectedMessage: string) => {
	const capturedError = await actorCalled(lastActorName).answer(PropertyOperationError.captured());
	if (!capturedError) {
		throw new Error(`Expected the property error message to be exactly "${expectedMessage}" but no error was captured`);
	}
	if (capturedError !== expectedMessage) {
		throw new Error(`Expected the property error message to be exactly "${expectedMessage}" but got: "${capturedError}"`);
	}
});

Then('the property operation should be rejected as unauthorized', async () => {
	const capturedError = await expectRejectedOperation();
	if (!/unauthorized|not authorized|forbidden|access denied|permission/i.test(capturedError)) {
		throw new Error(`Expected the property operation to be rejected as unauthorized, but the error was: "${capturedError}"`);
	}
});

async function expectRejectedOperation(): Promise<string> {
	const actor = actorCalled(lastActorName);
	const status = await actor.answer(PropertyOperationStatus.of());
	if (status === 'SUCCESS') {
		throw new Error('Expected the property operation to be rejected, but it succeeded');
	}
	const capturedError = await actor.answer(PropertyOperationError.captured());
	if (!capturedError) {
		throw new Error('Expected the property operation to be rejected with an error, but no error was captured');
	}
	if (SCHEMA_LEVEL_ERROR.test(capturedError)) {
		throw new Error(`The property API is not implemented yet, so the rejection could not be verified. GraphQL reported: "${capturedError}"`);
	}
	return capturedError;
}

Then('{word} should see a property error for {string}', async (actorName: string, fieldName: string) => {
	const resolvedActorName = ActorName.resolve(actorName, { defaultName: lastActorName });
	const actor = actorCalled(resolvedActorName);

	const capturedError = await actor.answer(PropertyOperationError.captured());
	if (!capturedError) {
		throw new Error(`Expected a validation error for "${fieldName}" but none was found`);
	}
	if (SCHEMA_LEVEL_ERROR.test(capturedError)) {
		throw new Error(`The property API is not implemented yet, so the validation error could not be verified. GraphQL reported: "${capturedError}"`);
	}

	const isFieldMentioned = capturedError.toLowerCase().includes(fieldName.toLowerCase());
	const isValidationPattern = /cannot be empty|required|missing|invalid|must not be empty|too short|too long|whitespace/i.test(capturedError);
	if (!isFieldMentioned && !isValidationPattern) {
		throw new Error(`Expected a validation error related to "${fieldName}", but got: "${capturedError}"`);
	}

	const propertyId = await actor.answer(LastPropertyId.recorded());
	if (propertyId) {
		throw new Error(`Expected property creation to be blocked by "${fieldName}" validation, but a property was created with id: ${propertyId}`);
	}
});

Then('no property should be created', async () => {
	const actor = actorCalled(lastActorName);

	const propertyId = await actor.answer(LastPropertyId.recorded());
	if (propertyId) {
		throw new Error(`Expected no property to be created, but one was created with id: ${propertyId}`);
	}

	const capturedError = await actor.answer(PropertyOperationError.captured());
	if (!capturedError) {
		throw new Error('Expected an error to prevent property creation, but no error was captured. The test may be passing without actually validating the scenario.');
	}
});
