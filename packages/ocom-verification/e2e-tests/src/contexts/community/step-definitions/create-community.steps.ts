import { ActorName } from '@cellix/serenity-framework/cucumber/actor-name';
import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import { LogInWithOAuth2 } from '../../../shared/abilities/oauth2-login.ts';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';
import { CommunityCreatedFlag } from '../questions/community-created-flag.ts';
import { CommunityErrorMessage } from '../questions/community-error-message.ts';
import { CommunityName } from '../questions/community-name.ts';
import { CreateCommunity } from '../tasks/create-community.ts';
import { waitForCommunityCreationQueueMessage } from '../../../shared/support/queue-storage.ts';

let lastActorName = actors.CommunityOwner.name;

Given('{word} is an authenticated community owner', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(LogInWithOAuth2(actors.CommunityOwner.email));
});

When('{word} creates a community with:', async (actorName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<{ name?: string }>();
	const name = details['name'] ?? '';

	await actor.attemptsTo(CreateCommunity(name));
});

When('{word} attempts to create a community with:', async (actorName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<{ name?: string }>();
	const name = details['name'] ?? '';

	try {
		await actor.attemptsTo(CreateCommunity(name));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		await actor.attemptsTo(notes<CommunityE2ENotes>().set('communityId', null), notes<CommunityE2ENotes>().set('errorMessage', errorMessage), notes<CommunityE2ENotes>().set('communityCreated', false));
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
	const actualName = await actor.answer(CommunityName());

	if (actualName !== expectedName) {
		throw new Error(`Expected community name "${expectedName}" but got "${actualName}"`);
	}
});

Then('a community creation queue message should be recorded', async () => {
	const actor = actorCalled(lastActorName);
	const communityId = await actor.answer(notes<CommunityE2ENotes>().get('communityId'));
	const communityName = await actor.answer(notes<CommunityE2ENotes>().get('communityName'));
	const message = await waitForCommunityCreationQueueMessage({
		communityId,
		name: communityName,
	});

	if (!message.communityId) {
		throw new Error('Expected queued community creation message to include a communityId');
	}

	if (!message.createdBy) {
		throw new Error('Expected queued community creation message to include createdBy');
	}
});

Then('{word} should see a community error for {string}', async (actorName: string, fieldName: string) => {
	const resolvedName = ActorName.resolve(actorName, { defaultName: lastActorName });
	const actor = actorCalled(resolvedName);
	const errorMessage = await actor.answer(CommunityErrorMessage());

	if (!errorMessage) {
		throw new Error(`Expected a validation error for "${fieldName}" but none was found`);
	}

	const lowerError = errorMessage.toLowerCase();
	const lowerField = fieldName.toLowerCase();
	const isFieldMentioned = lowerError.includes(lowerField);
	const isValidationPattern = /cannot be empty|required|missing|invalid|must not be empty|too short|too long/i.test(errorMessage);

	if (!isFieldMentioned && !isValidationPattern) {
		throw new Error(`Expected a validation error related to "${fieldName}", but got: "${errorMessage}"`);
	}
});

Then('no community should be created', async () => {
	const actor = actorCalled(lastActorName);
	const created = await actor.answer(CommunityCreatedFlag());

	if (created) {
		throw new Error('Expected no community to be created, but one was created');
	}
});
