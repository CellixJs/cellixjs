import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { type Actor, actorCalled, notes } from '@serenity-js/core';
import type { MemberPropertyNotes } from '../notes/member-property-notes.ts';
import {
	MemberPropertyDirectoryNames,
	MemberPropertyDirectoryStatus,
	MemberPropertyNamed,
	MemberPropertyOperationError,
	MemberPropertyOperationStatus,
	MemberPropertyReadError,
	MemberPropertyReadStatus,
} from '../questions/member-property-state.ts';
import { ArrangeMemberProperty, MakeForeignMemberAvailable } from '../tasks/arrange-member-property.ts';
import { BecomeSeparateOwnPropertyMember } from '../tasks/become-separate-own-property-member.ts';
import { EstablishMemberPropertyCommunity } from '../tasks/establish-member-property-community.ts';
import { memberPropertyCommunityOf, memberPropertyIdKnownTo } from '../tasks/member-property-context.ts';
import {
	AttemptMemberPropertyCreateWithOwner,
	CreateMemberProperty,
	DeleteMemberProperty,
	type MemberPropertyUpdateInput,
	OpenMemberPropertyDirectory,
	ReadMemberProperty,
	UpdateMemberProperty,
} from '../tasks/member-property-operations.ts';
import { BecomeMemberPropertyManager, BecomeMemberPropertyVisitor, type MemberPropertyVisitor } from '../tasks/member-property-personas.ts';

const MAYA = 'Maya';
const INSPECTOR = 'MemberPropertyInspector';
const UNKNOWN_PROPERTY_ID = 'ffffffffffffffffffffffff';
const SCHEMA_LEVEL_ERROR = /cannot query field|unknown argument|unknown type|is not defined by type/i;

let lastActorName = MAYA;

async function mayaCommunity() {
	return await memberPropertyCommunityOf(actorCalled(MAYA));
}

async function managerInspector(): Promise<Actor> {
	const actor = actorCalled(INSPECTOR);
	await actor.attemptsTo(BecomeMemberPropertyManager.inCommunity(await mayaCommunity()));
	return actor;
}

async function propertyIdFor(actor: Actor, propertyName: string): Promise<string> {
	const knownForActor = await memberPropertyIdKnownTo(actor, propertyName);
	if (knownForActor) {
		return knownForActor;
	}
	const knownForMaya = await memberPropertyIdKnownTo(actorCalled(MAYA), propertyName);
	if (knownForMaya) {
		return knownForMaya;
	}
	throw new Error(`No member Property id is recorded for "${propertyName}". Did a fixture arrange it first?`);
}

async function ownerIdFor(actor: Actor, value: string): Promise<string> {
	if (value === 'self') {
		const memberId = await actor.answer(notes<MemberPropertyNotes>().get('actingMemberId'));
		if (!memberId) {
			throw new Error('No acting member id is available for the supplied self ownerId');
		}
		return memberId;
	}
	if (value === 'foreign') {
		const foreignMemberId = await actor.answer(notes<MemberPropertyNotes>().get('foreignMemberId'));
		if (!foreignMemberId) {
			throw new Error('No foreign member id is available for the supplied ownerId');
		}
		return foreignMemberId;
	}
	throw new Error(`Unsupported supplied member Property owner id selector "${value}"`);
}

async function updateInputFor(actor: Actor, dataTable: DataTable): Promise<MemberPropertyUpdateInput> {
	const raw = GherkinDataTable.from(dataTable).rowsHash<Record<string, string>>();
	const input: MemberPropertyUpdateInput = {};
	if (raw.propertyName !== undefined) {
		input.propertyName = raw.propertyName;
	}
	if (raw.propertyType !== undefined) {
		input.propertyType = raw.propertyType.trim() === '' ? null : raw.propertyType;
	}
	if (raw.ownerId !== undefined) {
		input.ownerId = raw.ownerId === 'clear' ? null : await ownerIdFor(actor, raw.ownerId);
	}
	if (raw.listedInDirectory !== undefined) {
		if (raw.listedInDirectory !== 'true' && raw.listedInDirectory !== 'false') {
			throw new Error(`The listedInDirectory value must be "true" or "false", not "${raw.listedInDirectory}"`);
		}
		input.listedInDirectory = raw.listedInDirectory === 'true';
	}
	return input;
}

async function expectOperationSucceeded(): Promise<void> {
	const actor = actorCalled(lastActorName);
	const status = await actor.answer(MemberPropertyOperationStatus());
	if (status !== 'SUCCESS') {
		const error = await actor.answer(MemberPropertyOperationError());
		throw new Error(`Expected the member Property operation to succeed, but it was "${status}"${error ? `: ${error}` : ''}`);
	}
}

async function expectOperationRejected(): Promise<string> {
	const actor = actorCalled(lastActorName);
	const status = await actor.answer(MemberPropertyOperationStatus());
	if (status === 'SUCCESS') {
		throw new Error('Expected the member Property operation to be rejected, but it succeeded');
	}
	const error = await actor.answer(MemberPropertyOperationError());
	if (!error) {
		throw new Error('Expected a rejected member Property operation to record an error');
	}
	if (SCHEMA_LEVEL_ERROR.test(error)) {
		throw new Error(`Member Property behavior could not be verified because the GraphQL schema rejected the operation: "${error}"`);
	}
	return error;
}

async function expectDirectoryContains(propertyName: string, expected: boolean): Promise<void> {
	const actor = actorCalled(lastActorName);
	const status = await actor.answer(MemberPropertyDirectoryStatus());
	if (status !== 'SUCCESS') {
		const error = await actor.answer(MemberPropertyOperationError());
		throw new Error(`Expected the member Property directory to load before checking "${propertyName}", but it was "${status}"${error ? `: ${error}` : ''}`);
	}
	const names = await actor.answer(MemberPropertyDirectoryNames());
	const found = names.includes(propertyName);
	if (found !== expected) {
		throw new Error(`Expected the member Property directory to ${expected ? 'include' : 'exclude'} "${propertyName}", but it listed: ${names.join(', ') || 'none'}`);
	}
}

async function expectDetailsAvailable(): Promise<void> {
	const actor = actorCalled(lastActorName);
	const status = await actor.answer(MemberPropertyReadStatus());
	if (status !== 'FOUND') {
		const error = await actor.answer(MemberPropertyReadError());
		throw new Error(`Expected the member Property details to be available, but they were "${status ?? 'not read'}"${error ? `: ${error}` : ''}`);
	}
}

async function inspectProperty(propertyName: string) {
	const inspector = await managerInspector();
	return await inspector.answer(MemberPropertyNamed.called(propertyName));
}

Given('{word} is an accepted own-property member in a member Property community', async (actorName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(EstablishMemberPropertyCommunity.forOwnPropertyMember());
});

Given('a foreign same-community member is available for member Property ownership', async () => {
	await actorCalled(MAYA).attemptsTo(MakeForeignMemberAvailable.inCurrentCommunity());
});

Given('a foreign same-community member owns the member Property {string}', async (propertyName: string) => {
	const actor = actorCalled(MAYA);
	await actor.attemptsTo(MakeForeignMemberAvailable.inCurrentCommunity(), ArrangeMemberProperty.ownedByForeignMember(propertyName));
});

Given('{word} owns the member Property {string}', async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(ArrangeMemberProperty.ownedByCurrentMember(propertyName));
});

Given("{word} is the property manager of Maya's member Property community", async (actorName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(BecomeMemberPropertyManager.inCommunity(await mayaCommunity()));
});

Given("{word} is a {string} member Property API visitor in Maya's community", async (actorName: string, visitor: string) => {
	if (!['no-permission', 'no-role', 'created', 'rejected', 'guest'].includes(visitor)) {
		throw new Error(`Unsupported member Property API visitor "${visitor}"`);
	}
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(BecomeMemberPropertyVisitor.inCommunity(visitor as MemberPropertyVisitor, await mayaCommunity()));
});

Given('{word} is an accepted own-property member of a separate member Property community', async (actorName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(BecomeSeparateOwnPropertyMember.inNewCommunity());
});

When('{word} opens the member Property directory', async (actorName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(OpenMemberPropertyDirectory.currentCommunity());
});

When('{word} creates a member Property named {string}', async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(CreateMemberProperty.named(propertyName));
});

When('{word} attempts to create a member Property named {string}', async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(CreateMemberProperty.named(propertyName));
});

When('{word} sets the member Property {string} listing flag {string} to {string}', async (actorName: string, propertyName: string, flag: string, value: string) => {
	if (flag !== 'listedInDirectory') {
		throw new Error(`Only the representative member-editable flag "listedInDirectory" is supported, not "${flag}"`);
	}
	if (value !== 'true' && value !== 'false') {
		throw new Error(`The listing flag value must be "true" or "false", not "${value}"`);
	}
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(UpdateMemberProperty.with(propertyName, await propertyIdFor(actor, propertyName), { listedInDirectory: value === 'true' }));
});

When('{word} attempts to set the member Property {string} listing flag {string} to {string}', async (actorName: string, propertyName: string, flag: string, value: string) => {
	if (flag !== 'listedInDirectory') {
		throw new Error(`Only the representative member-editable flag "listedInDirectory" is supported, not "${flag}"`);
	}
	if (value !== 'true' && value !== 'false') {
		throw new Error(`The listing flag value must be "true" or "false", not "${value}"`);
	}
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(UpdateMemberProperty.with(propertyName, await propertyIdFor(actor, propertyName), { listedInDirectory: value === 'true' }));
});

When('{word} attempts to update the member Property {string} with:', async (actorName: string, propertyName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(UpdateMemberProperty.with(propertyName, await propertyIdFor(actor, propertyName), await updateInputFor(actor, dataTable)));
});

When('{word} attempts to delete the member Property {string}', async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(DeleteMemberProperty.identifiedAs(propertyName, await propertyIdFor(actor, propertyName)));
});

When('{word} attempts to create a member Property named {string} with supplied owner id {string}', async (actorName: string, propertyName: string, owner: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(AttemptMemberPropertyCreateWithOwner.named(propertyName, await ownerIdFor(actor, owner)));
});

When("{word} attempts to list Maya's member Property directory", async (actorName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(OpenMemberPropertyDirectory.community((await mayaCommunity()).communityId));
});

When("{word} attempts to read the member Property {string} from Maya's community", async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ReadMemberProperty.identifiedAs(propertyName, await propertyIdFor(actor, propertyName)));
});

When("{word} reads the member Property {string} from Maya's community", async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ReadMemberProperty.identifiedAs(propertyName, await propertyIdFor(actor, propertyName)));
});

When('{word} attempts to update an unknown member Property', async (actorName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(UpdateMemberProperty.with('Unknown Member Property', UNKNOWN_PROPERTY_ID, { listedInDirectory: true }));
});

When('{word} deletes the member Property {string}', async (actorName: string, propertyName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(DeleteMemberProperty.identifiedAs(propertyName, await propertyIdFor(actor, propertyName)));
});

Then('the member Property operation succeeds', async () => {
	await expectOperationSucceeded();
});

Then('the member Property operation is rejected', async () => {
	await expectOperationRejected();
});

Then('the member Property error is exactly {string}', async (expectedError: string) => {
	const actual = await actorCalled(lastActorName).answer(MemberPropertyOperationError());
	if (actual !== expectedError) {
		throw new Error(`Expected the member Property error to be exactly "${expectedError}", but got "${actual ?? 'none'}"`);
	}
});

Then('the member Property directory includes {string}', async (propertyName: string) => {
	await expectDirectoryContains(propertyName, true);
});

Then('the member Property directory does not include {string}', async (propertyName: string) => {
	await expectDirectoryContains(propertyName, false);
});

Then('the member Property {string} is persisted with {word} as its owner', async (propertyName: string, ownerActorName: string) => {
	const property = await inspectProperty(propertyName);
	const expectedOwnerId = await actorCalled(ownerActorName).answer(notes<MemberPropertyNotes>().get('actingMemberId'));
	if (!property?.owner || property.owner.id !== expectedOwnerId) {
		throw new Error(`Expected the member Property "${propertyName}" to be owned by ${ownerActorName} (${expectedOwnerId}), but it is owned by ${property?.owner?.id ?? 'nobody'}`);
	}
});

Then('the member Property {string} has listing flag {string} set to {string}', async (propertyName: string, flag: string, expectedValue: string) => {
	if (flag !== 'listedInDirectory') {
		throw new Error(`Only the representative listing flag "listedInDirectory" can be asserted, not "${flag}"`);
	}
	const property = await inspectProperty(propertyName);
	const actual = property?.listedInDirectory;
	if (actual !== (expectedValue === 'true')) {
		throw new Error(`Expected the member Property "${propertyName}" to have ${flag}=${expectedValue}, but got ${actual ?? 'missing property'}`);
	}
});

Then('{word} sees the member Property {string} listing flag {string} set to {string}', async (actorName: string, propertyName: string, flag: string, expectedValue: string) => {
	if (flag !== 'listedInDirectory') {
		throw new Error(`Only the representative listing flag "listedInDirectory" can be asserted, not "${flag}"`);
	}
	const property = await actorCalled(actorName).answer(MemberPropertyNamed.called(propertyName));
	if (property?.listedInDirectory !== (expectedValue === 'true')) {
		throw new Error(`Expected ${actorName} to see ${flag}=${expectedValue} for "${propertyName}", but got ${property?.listedInDirectory ?? 'missing property'}`);
	}
});

Then('the member Property {string} has no property type', async (propertyName: string) => {
	const property = await inspectProperty(propertyName);
	if (property?.propertyType !== null) {
		throw new Error(`Expected the member Property "${propertyName}" to have no property type, but got "${property?.propertyType ?? 'missing property'}"`);
	}
});

Then('the member Property {string} remains owned by {word}', async (propertyName: string, ownerActorName: string) => {
	const property = await inspectProperty(propertyName);
	const expectedOwnerId = await actorCalled(ownerActorName).answer(notes<MemberPropertyNotes>().get('actingMemberId'));
	if (property?.owner?.id !== expectedOwnerId) {
		throw new Error(`Expected the member Property "${propertyName}" to remain owned by ${ownerActorName}, but it is owned by ${property?.owner?.id ?? 'nobody'}`);
	}
});

Then('the member Property {string} remains active', async (propertyName: string) => {
	if (!(await inspectProperty(propertyName))) {
		throw new Error(`Expected the member Property "${propertyName}" to remain active, but the manager cannot find it`);
	}
});

Then("the member Property {string} remains in Maya's community", async (propertyName: string) => {
	const property = await inspectProperty(propertyName);
	const { communityId } = await mayaCommunity();
	if (property?.community.id !== communityId) {
		throw new Error(`Expected the member Property "${propertyName}" to remain in Maya's community "${communityId}", but it belongs to "${property?.community.id ?? 'no community'}"`);
	}
});

Then('no member Property named {string} is created', async (propertyName: string) => {
	const property = await inspectProperty(propertyName);
	if (property) {
		throw new Error(`Expected no member Property named "${propertyName}" to be created, but it has id ${property.id}`);
	}
});

Then('the member Property details are unavailable', async () => {
	const actor = actorCalled(lastActorName);
	const status = await actor.answer(MemberPropertyReadStatus());
	if (status !== 'MISSING') {
		const error = await actor.answer(MemberPropertyReadError());
		throw new Error(`Expected the member Property read to be non-disclosing and unavailable, but it was "${status}"${error ? `: ${error}` : ''}`);
	}
});

Then('the member Property details are available', async () => {
	await expectDetailsAvailable();
});
