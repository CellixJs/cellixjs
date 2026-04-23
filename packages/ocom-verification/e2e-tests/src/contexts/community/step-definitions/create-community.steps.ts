import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { TestActors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import { OAuth2Login } from '../../../shared/support/oauth2-login.ts';
import { CommunityCreatedFlag, CommunityErrorMessage, CreatedCommunityName } from '../questions.ts';
import { CreateCommunity } from '../tasks/create-community.ts';
import type { CommunityE2ENotes } from '../types.ts';

let lastActorName = TestActors.CommunityOwner.name;

Given('{word} is an authenticated community owner', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(OAuth2Login(TestActors.CommunityOwner.email));
});

When('{word} creates a community with:', async (actorName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const details = dataTable.rowsHash();
	const name = details.name ?? '';

	await actor.attemptsTo(CreateCommunity(name));
});

When('{word} attempts to create a community with:', async (actorName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const details = dataTable.rowsHash();
	const name = details.name ?? '';

	try {
		await actor.attemptsTo(CreateCommunity(name));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		await actor.attemptsTo(notes<CommunityE2ENotes>().set('errorMessage', errorMessage), notes<CommunityE2ENotes>().set('communityCreated', false));
	}
});

Then('the community should be created successfully', async () => {
	const actor = actorCalled(lastActorName);
	const created = await actor.answer(CommunityCreatedFlag());

	if (!created) {
		throw new Error('Expected community creation to succeed');
	}
});

Then('the community name should be {string}', async (expectedName: string) => {
	const actor = actorCalled(lastActorName);
	const actualName = await actor.answer(CreatedCommunityName());

	if (actualName !== expectedName) {
		throw new Error(`Expected community name "${expectedName}" but got "${actualName}"`);
	}
});

Then('{word} should see a community error for {string}', async (actorName: string, _fieldName: string) => {
	const resolvedName = /^(she|he|they)$/i.test(actorName) ? lastActorName : actorName;
	const actor = actorCalled(resolvedName);
	const errorMessage = await actor.answer(CommunityErrorMessage());

	if (!errorMessage) {
		throw new Error(`Expected a validation error for "${_fieldName}" but none was found`);
	}
});

Then('no community should be created', async () => {
	const actor = actorCalled(lastActorName);
	const created = await actor.answer(CommunityCreatedFlag());

	if (created) {
		throw new Error('Expected no community to be created, but one was created');
	}
});
