import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { Ensure, equals } from '@serenity-js/assertions';
import { actorCalled, notes } from '@serenity-js/core';
import { resolveActorName } from '../../../shared/support/domain-test-helpers.ts';
import type { CommunityDetails, CommunityNotes } from '../abilities/community-types.ts';
import { CommunityName } from '../questions/community-name.ts';
import { CommunityStatus } from '../questions/community-status.ts';
import { CreateCommunity } from '../tasks/create-community.ts';

let lastActorName = actors.CommunityOwner.name;

Given('{word} is an authenticated community owner', (actorName: string) => {
	lastActorName = actorName;
	actorCalled(actorName);
});

When('{word} creates a community with:', async (actorName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const details = dataTable.rowsHash() as unknown as CommunityDetails;

	await actor.attemptsTo(CreateCommunity.with(details));
});

When('{word} attempts to create a community with:', async (actorName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const details = dataTable.rowsHash() as unknown as CommunityDetails;

	await actor.attemptsTo(notes<CommunityNotes>().set('lastCommunityId', undefined as unknown as string), notes<CommunityNotes>().set('lastValidationError', undefined as unknown as string));

	try {
		await actor.attemptsTo(CreateCommunity.with(details));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		await actor.attemptsTo(notes<CommunityNotes>().set('lastValidationError', errorMessage));
	}
});

Then('the community should be created successfully', async () => {
	const actor = actorCalled(lastActorName);

	await actor.attemptsTo(Ensure.that(CommunityStatus.of(), equals('SUCCESS')));
});

Then('the community name should be {string}', async (expectedName: string) => {
	const actor = actorCalled(lastActorName);

	await actor.attemptsTo(Ensure.that(CommunityName.displayed(), equals(expectedName)));
});

Then('{word} should see a community error for {string}', async (actorName: string, fieldName: string) => {
	const resolvedActorName = resolveActorName(actorName, lastActorName);
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

		let communityId: string | undefined;
		try {
			communityId = await actor.answer(notes<CommunityNotes>().get('lastCommunityId'));
		} catch {
			// expected
		}
		if (communityId) {
			throw new Error(`Expected community creation to be blocked by "${fieldName}" validation, but a community was created with id: ${communityId}`);
		}

		return;
	}

	throw new Error(`Expected a validation error for "${fieldName}" but none was found`);
});

Then('no community should be created', async () => {
	const actor = actorCalled(lastActorName);

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
