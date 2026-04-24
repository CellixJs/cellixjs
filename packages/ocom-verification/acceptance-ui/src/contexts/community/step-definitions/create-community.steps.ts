import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { TestActors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import type { CommunityUiNotes } from '../abilities/community-types.ts';
import { CommunityCreatedFlag } from '../questions/community-created-flag.ts';
import { CommunityErrorMessage } from '../questions/community-error-message.ts';
import { CommunityName } from '../questions/community-name.ts';
import { CreateCommunity } from '../tasks/create-community.ts';

// Track last actor used in When steps so Then steps can reference them
let lastActorName = TestActors.CommunityOwner.name;

Given('{word} is an authenticated community owner', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);

	// Set up a minimal form container in jsdom for the test.
	const container = document.getElementById('root') ?? document.createElement('div');
	container.innerHTML = `
			<form>
				<label for="community-name">Community Name</label>
				<input id="community-name" placeholder="Name" required type="text" />
				<button type="submit" role="button">Create Community</button>
			</form>
		`;
	if (!container.parentElement) {
		document.body.appendChild(container);
	}

	const form = container.querySelector('form');
	const nameInput = container.querySelector<HTMLInputElement>('#community-name');

	if (!form || !nameInput) {
		throw new Error('Community form test fixture did not initialize correctly');
	}

	const syncValidity = () => {
		nameInput.setCustomValidity(nameInput.value.trim().length === 0 ? 'Community name cannot be empty' : '');
	};

	nameInput.addEventListener('input', () => {
		syncValidity();
		container.dataset['formSubmitted'] = 'false';
		container.dataset['communityName'] = '';
		container.dataset['lastValidationError'] = '';
	});

	nameInput.addEventListener('invalid', () => {
		container.dataset['formSubmitted'] = 'false';
		container.dataset['communityName'] = '';
		container.dataset['lastValidationError'] = nameInput.validationMessage || 'Community name cannot be empty';
	});

	form.addEventListener('submit', (event: SubmitEvent) => {
		event.preventDefault();

		const name = nameInput.value;
		if (!name || name.trim().length === 0) {
			container.dataset['formSubmitted'] = 'false';
			container.dataset['communityName'] = '';
			container.dataset['lastValidationError'] = 'Community name cannot be empty';
			return;
		}

		container.dataset['formSubmitted'] = 'true';
		container.dataset['communityName'] = name;
		container.dataset['lastValidationError'] = '';
	});

	syncValidity();
	container.dataset['formSubmitted'] = 'false';
	container.dataset['communityName'] = '';
	container.dataset['lastValidationError'] = '';

	await actor.attemptsTo(notes<CommunityUiNotes>().set('container', container));
	await actor.attemptsTo(notes<CommunityUiNotes>().set('formSubmitted', false));
	await actor.attemptsTo(notes<CommunityUiNotes>().set('communityName', ''));
	await actor.attemptsTo(notes<CommunityUiNotes>().set('lastValidationError', ''));
});

When('{word} creates a community with:', async (actorName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const details = dataTable.rowsHash();
	const name = details['name'] ?? '';

	await actor.attemptsTo(CreateCommunity(name));
});

When('{word} attempts to create a community with:', async (actorName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const details = dataTable.rowsHash();
	const name = details['name'] ?? '';

	await actor.attemptsTo(CreateCommunity(name));
});

Then('the community should be created successfully', async () => {
	const actor = actorCalled(lastActorName);
	const submitted = await actor.answer(CommunityCreatedFlag());

	if (!submitted) {
		throw new Error('Expected community form to be submitted');
	}
});

Then('the community name should be {string}', async (expectedName: string) => {
	const actor = actorCalled(lastActorName);
	const name = await actor.answer(CommunityName());

	if (name !== expectedName) {
		throw new Error(`Expected community name "${expectedName}" but got "${name}"`);
	}
});

Then('{word} should see a community error for {string}', async (actorName: string, fieldName: string) => {
	const resolvedName = /^(she|he|they)$/i.test(actorName) ? lastActorName : actorName;
	const actor = actorCalled(resolvedName);

	let storedError: string | undefined;
	try {
		storedError = await actor.answer(CommunityErrorMessage());
	} catch {
		// No error
	}

	if (storedError) {
		const lowerError = storedError.toLowerCase();
		const lowerField = fieldName.toLowerCase();
		const isFieldMentioned = lowerError.includes(lowerField);
		const isValidationPattern = /cannot be empty|required|missing|invalid|must not be empty/i.test(storedError);

		if (!isFieldMentioned && !isValidationPattern) {
			throw new Error(`Expected a validation error related to "${fieldName}", but got: "${storedError}"`);
		}
		return;
	}

	throw new Error(`Expected a validation error for "${fieldName}" but none was found`);
});

Then('no community should be created', async () => {
	const actor = actorCalled(lastActorName);

	let hasValidationError = false;
	try {
		const storedError = await actor.answer(CommunityErrorMessage());
		hasValidationError = !!storedError;
	} catch {
		// No error stored
	}

	if (!hasValidationError) {
		throw new Error('Expected a validation error to prevent community creation, but no error was captured.');
	}
});
