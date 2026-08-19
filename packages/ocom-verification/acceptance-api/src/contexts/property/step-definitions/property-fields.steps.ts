import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { type Actor, actorCalled, notes } from '@serenity-js/core';
import type { PropertyNotes } from '../notes/property-notes.ts';
import { PropertyField } from '../questions/property-field.ts';
import { ActingMemberName, PropertyFullNamed, PropertyListCell } from '../questions/property-full.ts';
import { PropertyNamed } from '../questions/property-named.ts';
import { CreatePropertyWithFullFields } from '../tasks/create-property-full.ts';
import { actualFullFieldValue, normalizeExpectedFieldValue, splitList } from '../tasks/property-full-field-set.ts';
import { UpdatePropertyFullFields } from '../tasks/update-property-full-fields.ts';
import { ViewPropertiesList } from '../tasks/view-properties-list.ts';

let lastFieldsActorName = actors.CommunityOwner.name;

const theActorCalled = (actorName: string): Actor => {
	lastFieldsActorName = actorName;
	return actorCalled(actorName);
};

async function resolvePropertyId(actor: Actor, propertyName: string): Promise<string> {
	const property = await actor.answer(PropertyNamed.called(propertyName));
	if (!property?.id) {
		throw new Error(`No property named "${propertyName}" is known in this scenario. Did an actor create it first?`);
	}
	return property.id;
}

async function propertyFullNamed(propertyName: string) {
	const property = await actorCalled(lastFieldsActorName).answer(PropertyFullNamed.called(propertyName));
	if (!property) {
		throw new Error(`The property "${propertyName}" was not found in the properties list`);
	}
	return property;
}

function assertFieldValues(propertyName: string, expected: Record<string, string>, actualOf: (key: string) => string): void {
	const mismatches: string[] = [];
	for (const [key, rawExpected] of Object.entries(expected)) {
		const expectedValue = normalizeExpectedFieldValue(key, rawExpected);
		const actualValue = actualOf(key);
		if (actualValue !== expectedValue) {
			mismatches.push(`${key}: expected "${expectedValue}" but got "${actualValue}"`);
		}
	}
	if (mismatches.length > 0) {
		throw new Error(`The property "${propertyName}" does not carry the expected field values:\n${mismatches.join('\n')}`);
	}
}

When('{word} creates a property with the full field set:', async (actorName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const actor = theActorCalled(actorName);
	await actor.attemptsTo(notes<PropertyNotes>().set('submittedPropertyFields', details), CreatePropertyWithFullFields.from(details));
});

Then('{word} should land back on the properties list', async (actorName: string) => {
	const actor = theActorCalled(actorName);
	await actor.attemptsTo(ViewPropertiesList.displayed());
	const listedNames = await actor.answer(notes<PropertyNotes>().get('listedPropertyNames'));
	const lastPropertyName = await actor.answer(notes<PropertyNotes>().get('lastPropertyName'));
	if (!lastPropertyName || !listedNames.includes(lastPropertyName)) {
		throw new Error(`Expected the properties list to include the newly created property "${lastPropertyName}" but it lists: ${listedNames.join(', ')}`);
	}
});

Then('the property {string} should record the full field set', async (propertyName: string) => {
	const actor = actorCalled(lastFieldsActorName);
	const submitted = await actor.answer(notes<PropertyNotes>().get('submittedPropertyFields'));
	if (!submitted || Object.keys(submitted).length === 0) {
		throw new Error('No submitted property field set was recorded for this scenario');
	}
	const property = await propertyFullNamed(propertyName);
	assertFieldValues(propertyName, submitted, (key) => actualFullFieldValue(property, key));
});

When('{word} updates the address of the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(UpdatePropertyFullFields.withFields(propertyName, propertyId, details, 'updates the address'));
});

Then('the property {string} should have the address:', async (propertyName: string, dataTable: DataTable) => {
	const expected = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const property = await propertyFullNamed(propertyName);
	assertFieldValues(propertyName, expected, (key) => actualFullFieldValue(property, key));
});

When('{word} sets the owner of the property {string} to their own member', async (actorName: string, propertyName: string) => {
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	const memberId = await actor.answer(notes<PropertyNotes>().get('actingMemberId'));
	if (!memberId) {
		throw new Error(`${actorName} has no acting member id recorded. Did the actor become a property manager first?`);
	}
	await actor.attemptsTo(UpdatePropertyFullFields.withOwner(propertyName, propertyId, memberId));
});

Then("the property {string} should be owned by {word}'s member", async (propertyName: string, ownerActorName: string) => {
	const ownerActor = actorCalled(ownerActorName);
	const expectedMemberId = await ownerActor.answer(notes<PropertyNotes>().get('actingMemberId'));
	const expectedMemberName = await ownerActor.answer(ActingMemberName.ofActiveCommunity());
	const property = await propertyFullNamed(propertyName);
	if (property.owner?.id !== expectedMemberId) {
		throw new Error(`Expected the property "${propertyName}" to be owned by member ${expectedMemberId} but the owner is ${property.owner?.id ?? 'not recorded'}`);
	}
	if (property.owner?.memberName !== expectedMemberName) {
		throw new Error(`Expected the owner of "${propertyName}" to be named "${expectedMemberName}" but got "${property.owner?.memberName ?? ''}"`);
	}
});

When('{word} clears the owner of the property {string}', async (actorName: string, propertyName: string) => {
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(UpdatePropertyFullFields.withOwner(propertyName, propertyId, null));
});

Then('the property {string} should have no owner recorded', async (propertyName: string) => {
	const property = await propertyFullNamed(propertyName);
	if (property.owner !== null) {
		throw new Error(`Expected the property "${propertyName}" to have no owner but it is owned by "${property.owner.memberName ?? property.owner.id}"`);
	}
});

When('{word} updates the listing flags of the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(UpdatePropertyFullFields.withFields(propertyName, propertyId, details, 'updates the listing flags'));
});

Then('the property {string} should have the listing flags:', async (propertyName: string, dataTable: DataTable) => {
	const expected = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const property = await propertyFullNamed(propertyName);
	assertFieldValues(propertyName, expected, (key) => actualFullFieldValue(property, key));
});

When('{word} updates the tags of the property {string} to {string}', async (actorName: string, propertyName: string, tags: string) => {
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(UpdatePropertyFullFields.withTags(propertyName, propertyId, tags));
});

Then('the property {string} should have the tags {string}', async (propertyName: string, tags: string) => {
	const property = await propertyFullNamed(propertyName);
	assertFieldValues(propertyName, { tags }, (key) => actualFullFieldValue(property, key));
});

When('{word} updates the listing details of the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(UpdatePropertyFullFields.withFields(propertyName, propertyId, details, 'updates the listing details'));
});

Then('the property {string} should have the listing details:', async (propertyName: string, dataTable: DataTable) => {
	const expected = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const property = await propertyFullNamed(propertyName);
	assertFieldValues(propertyName, expected, (key) => actualFullFieldValue(property, key));
});

When('{word} updates the amenities of the property {string} to {string}', async (actorName: string, propertyName: string, amenities: string) => {
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(UpdatePropertyFullFields.withListingDetail(propertyName, propertyId, { amenities: splitList(amenities) }, `updates the amenities to "${amenities}"`));
});

When('{word} adds an additional amenity category {string} with amenities {string} to the property {string}', async (actorName: string, category: string, amenities: string, propertyName: string) => {
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(UpdatePropertyFullFields.withListingDetail(propertyName, propertyId, { additionalAmenities: [{ category, amenities: splitList(amenities) }] }, `adds the additional amenity category "${category}"`));
});

Then('the property {string} should have the amenities {string}', async (propertyName: string, amenities: string) => {
	const property = await propertyFullNamed(propertyName);
	assertFieldValues(propertyName, { amenities }, (key) => actualFullFieldValue(property, key));
});

Then('the property {string} should have an additional amenity category {string} with amenities {string}', async (propertyName: string, category: string, amenities: string) => {
	const property = await propertyFullNamed(propertyName);
	const entry = (property.listingDetail?.additionalAmenities ?? []).find((candidate) => candidate.category === category);
	if (!entry) {
		throw new Error(`The property "${propertyName}" has no additional amenity category "${category}"`);
	}
	const actual = (entry.amenities ?? []).join(', ');
	const expected = splitList(amenities).join(', ');
	if (actual !== expected) {
		throw new Error(`Expected the additional amenity category "${category}" of "${propertyName}" to have the amenities "${expected}" but got "${actual}"`);
	}
});

When('{word} adds a bedroom detail with room name {string} and bed descriptions {string} to the property {string}', async (actorName: string, roomName: string, bedDescriptions: string, propertyName: string) => {
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(UpdatePropertyFullFields.withListingDetail(propertyName, propertyId, { bedroomDetails: [{ roomName, bedDescriptions: splitList(bedDescriptions) }] }, `adds the bedroom detail "${roomName}"`));
});

Then('the property {string} should have a bedroom detail with room name {string} and bed descriptions {string}', async (propertyName: string, roomName: string, bedDescriptions: string) => {
	const property = await propertyFullNamed(propertyName);
	const entry = (property.listingDetail?.bedroomDetails ?? []).find((candidate) => candidate.roomName === roomName);
	if (!entry) {
		throw new Error(`The property "${propertyName}" has no bedroom detail with room name "${roomName}"`);
	}
	const actual = (entry.bedDescriptions ?? []).join(', ');
	const expected = splitList(bedDescriptions).join(', ');
	if (actual !== expected) {
		throw new Error(`Expected the bedroom detail "${roomName}" of "${propertyName}" to have the bed descriptions "${expected}" but got "${actual}"`);
	}
});

When('{word} updates the property {string} clearing its tags, amenities, images, and floor plan images', async (actorName: string, propertyName: string) => {
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	// Empty table-less cells become explicit empty arrays: the API contract is that [] clears a list.
	await actor.attemptsTo(UpdatePropertyFullFields.withFields(propertyName, propertyId, { tags: '', amenities: '', images: '', floorPlanImages: '' }, 'clears the list fields'));
});

When('{word} replaces the bedroom details of the property {string} with a room named {string} and no bed descriptions', async (actorName: string, propertyName: string, roomName: string) => {
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(UpdatePropertyFullFields.withListingDetail(propertyName, propertyId, { bedroomDetails: [{ roomName, bedDescriptions: [] }] }, `replaces the bedroom details with "${roomName}" without bed descriptions`));
});

Then('the property {string} should have no tags, amenities, images, or floor plan images recorded', async (propertyName: string) => {
	const property = await propertyFullNamed(propertyName);
	const readings: ReadonlyArray<[string, ReadonlyArray<string> | null | undefined]> = [
		['tags', property.tags],
		['amenities', property.listingDetail?.amenities],
		['images', property.listingDetail?.images],
		['floor plan images', property.listingDetail?.floorPlanImages],
	];
	for (const [field, actual] of readings) {
		// Both [] and null count as cleared; anything listed does not.
		if ((actual ?? []).length > 0) {
			throw new Error(`Expected the property "${propertyName}" to have no ${field} recorded but got: ${(actual ?? []).join(', ')}`);
		}
	}
});

Then('the property {string} should have a bedroom detail with room name {string} and no bed descriptions', async (propertyName: string, roomName: string) => {
	const property = await propertyFullNamed(propertyName);
	const entry = (property.listingDetail?.bedroomDetails ?? []).find((candidate) => candidate.roomName === roomName);
	if (!entry) {
		throw new Error(`The property "${propertyName}" has no bedroom detail with room name "${roomName}"`);
	}
	if ((entry.bedDescriptions ?? []).length > 0) {
		throw new Error(`Expected the bedroom detail "${roomName}" of "${propertyName}" to have no bed descriptions but got: ${(entry.bedDescriptions ?? []).join(', ')}`);
	}
});

When('{word} updates the media of the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(UpdatePropertyFullFields.withFields(propertyName, propertyId, details, 'updates the media links'));
});

Then('the property {string} should have the media links:', async (propertyName: string, dataTable: DataTable) => {
	const expected = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const property = await propertyFullNamed(propertyName);
	assertFieldValues(propertyName, expected, (key) => actualFullFieldValue(property, key));
});

When('{word} updates the listing agent of the property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const actor = theActorCalled(actorName);
	const propertyId = await resolvePropertyId(actor, propertyName);
	await actor.attemptsTo(UpdatePropertyFullFields.withFields(propertyName, propertyId, details, 'updates the listing agent details'));
});

Then('the property {string} should have the listing agent details:', async (propertyName: string, dataTable: DataTable) => {
	const expected = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const property = await propertyFullNamed(propertyName);
	assertFieldValues(propertyName, expected, (key) => actualFullFieldValue(property, key));
});

Then('the property {string} should have {float} bathrooms', async (propertyName: string, bathrooms: number) => {
	const actual = await actorCalled(lastFieldsActorName).answer(PropertyField.bathrooms(propertyName));
	if (actual !== bathrooms) {
		throw new Error(`Expected the property "${propertyName}" to have ${bathrooms} bathrooms but got ${actual}`);
	}
});

Then('the properties list should show {string} in the {string} column of {string}', async (expectedText: string, columnTitle: string, propertyName: string) => {
	const actual = await actorCalled(lastFieldsActorName).answer(PropertyListCell.of(propertyName, columnTitle));
	if (actual !== expectedText) {
		throw new Error(`Expected the "${columnTitle}" column of "${propertyName}" to show "${expectedText}" but got "${actual}"`);
	}
});

Then("the properties list should show {word}'s member name in the {string} column of {string}", async (ownerActorName: string, columnTitle: string, propertyName: string) => {
	const expected = await actorCalled(ownerActorName).answer(ActingMemberName.ofActiveCommunity());
	const actual = await actorCalled(lastFieldsActorName).answer(PropertyListCell.of(propertyName, columnTitle));
	if (actual !== expected) {
		throw new Error(`Expected the "${columnTitle}" column of "${propertyName}" to show the member name "${expected}" but got "${actual}"`);
	}
});
