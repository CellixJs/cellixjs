import { ActorName } from '@cellix/serenity-framework/cucumber/actor-name';
import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, notes } from '@serenity-js/core';
import { getRecordedCommunityCreationMessages, resetRecordedQueueMessages } from '../../../mock-application-services.ts';
import type { CommunityDetails, CommunityNotes } from '../notes/community-notes.ts';
import { CommunityName } from '../questions/community-name.ts';
import { CommunityStatus } from '../questions/community-status.ts';
import { CreateCommunity } from '../tasks/create-community.ts';
import { getLastActorName, setLastActorName } from './last-actor.ts';

Given('{word} is an authenticated community owner', (actorName: string) => {
	setLastActorName(actorName);
	resetRecordedQueueMessages();
	actorCalled(actorName);
});

When('{word} creates a community with:', async (actorName: string, dataTable: DataTable) => {
	setLastActorName(actorName);
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<CommunityDetails>();

	await actor.attemptsTo(CreateCommunity.with(details));
});

When('{word} attempts to create a community with:', async (actorName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<CommunityDetails>();
	await attemptCommunityCreation(actorName, details);
});

When('{word} attempts to create a community with a name of {int} characters', async (actorName: string, nameLength: number) => {
	await attemptCommunityCreation(actorName, { name: 'A'.repeat(nameLength) });
});

async function attemptCommunityCreation(actorName: string, details: CommunityDetails): Promise<void> {
	setLastActorName(actorName);
	const actor = actorCalled(actorName);

	await actor.attemptsTo(
		notes<CommunityNotes>().set('lastCommunityId', undefined as unknown as string),
		notes<CommunityNotes>().set('lastCommunityStatus', undefined as unknown as string),
		notes<CommunityNotes>().set('lastValidationError', undefined as unknown as string),
	);

	try {
		await actor.attemptsTo(CreateCommunity.with(details));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		await actor.attemptsTo(notes<CommunityNotes>().set('lastValidationError', errorMessage));
	}
}

Then('the community should be created successfully', async () => {
	const actor = actorCalled(getLastActorName());
	const status = await actor.answer(CommunityStatus.of());

	if (status !== 'SUCCESS') {
		throw new Error(`Expected community status "SUCCESS" but got "${status}"`);
	}
});

Then('the community name should be {string}', async (expectedName: string) => {
	const actor = actorCalled(getLastActorName());
	const actualName = await actor.answer(CommunityName.displayed());

	if (actualName !== expectedName) {
		throw new Error(`Expected community name "${expectedName}" but got "${actualName}"`);
	}
});

Then('a community creation queue message should be recorded', async () => {
	const actor = actorCalled(getLastActorName());
	const communityId = await actor.answer(notes<CommunityNotes>().get('lastCommunityId'));
	const communityName = await actor.answer(notes<CommunityNotes>().get('lastCommunityName'));

	const recordedMessage = getRecordedCommunityCreationMessages().find((message) => message.communityId === communityId);

	if (!recordedMessage) {
		throw new Error(`Expected a community creation queue message for community "${communityId}" but none was recorded`);
	}

	if (recordedMessage.name !== communityName) {
		throw new Error(`Expected queued community name "${communityName}" but got "${recordedMessage.name}"`);
	}

	if (!recordedMessage.createdBy) {
		throw new Error('Expected queued createdBy to be populated');
	}
});

Then('{word} should see a community error for {string}', async (actorName: string, fieldName: string) => {
	const resolvedActorName = ActorName.resolve(actorName, { defaultName: getLastActorName() });
	const actor = actorCalled(resolvedActorName);

	let storedError: string | undefined;
	try {
		storedError = await actor.answer(notes<CommunityNotes>().get('lastValidationError'));
	} catch {
		// No error in notes
	}

	if (storedError) {
		const lowerError = storedError.toLowerCase();
		const lowerField = fieldName.toLowerCase();
		const isFieldMentioned = lowerError.includes(lowerField);
		const isValidationPattern = /cannot be empty|required|missing|invalid|must not be empty|too short|too long/i.test(storedError);

		if (!isFieldMentioned && !isValidationPattern) {
			throw new Error(`Expected a validation error related to "${fieldName}", but got: "${storedError}"`);
		}

		let status: string | undefined;
		try {
			status = await actor.answer(notes<CommunityNotes>().get('lastCommunityStatus'));
		} catch {
			// expected
		}
		if (status === 'SUCCESS') {
			throw new Error(`Expected the community action to be blocked by "${fieldName}" validation, but it succeeded`);
		}

		return;
	}

	throw new Error(`Expected a validation error for "${fieldName}" but none was found`);
});

Then('no community should be created', async () => {
	const actor = actorCalled(getLastActorName());

	let hasValidationError = false;
	try {
		const storedError = await actor.answer(notes<CommunityNotes>().get('lastValidationError'));
		hasValidationError = !!storedError;
	} catch {
		// No error stored
	}

	let communityId: string | undefined;
	try {
		communityId = await actor.answer(notes<CommunityNotes>().get('lastCommunityId'));
	} catch {
		// No community ID: expected
	}

	if (communityId) {
		throw new Error(`Expected no community to be created, but one was created with id: ${communityId}`);
	}

	if (!hasValidationError) {
		throw new Error('Expected a validation error to prevent community creation, but no error was captured. The test may be passing without actually validating the scenario.');
	}
});
