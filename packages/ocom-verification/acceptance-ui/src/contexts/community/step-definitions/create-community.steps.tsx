import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { CommunityPage, type UiCommunityPage } from '@ocom-verification/verification-shared/pages';
import { JsdomPageAdapter } from '@ocom-verification/verification-shared/pages/jsdom';
import { actorCalled, notes } from '@serenity-js/core';
import { CommunityCreate } from '../../../../../../ocom/ui-community-route-accounts/src/components/community-create.tsx';
import { mountComponent } from '../../../shared/support/ui/react-render.ts';
import type { CellixUiWorld } from '../../../world.ts';
import type { CommunityUiNotes } from '../abilities/community-types.ts';
import { CommunityCreatedFlag } from '../questions/community-created-flag.ts';
import { CommunityErrorMessage } from '../questions/community-error-message.ts';
import { CommunityName } from '../questions/community-name.ts';
import { CreateCommunity } from '../tasks/create-community.ts';

Given('{word} is an authenticated community owner', async function (this: CellixUiWorld, actorName: string) {
	this.setCommunityActorName(actorName);
	const actor = actorCalled(actorName);

	const onSave = async (values: { name: string }): Promise<void> => {
		await actor.attemptsTo(notes<CommunityUiNotes>().set('formSubmitted', true), notes<CommunityUiNotes>().set('communityName', values.name ?? ''), notes<CommunityUiNotes>().set('lastValidationError', ''));
	};

	const rendered = mountComponent(<CommunityCreate onSave={onSave} />);
	this.setCommunityContainer(rendered.container);

	await actor.attemptsTo(notes<CommunityUiNotes>().set('formSubmitted', false), notes<CommunityUiNotes>().set('communityName', ''), notes<CommunityUiNotes>().set('lastValidationError', ''));
});

When('{word} creates a community with:', async function (this: CellixUiWorld, actorName: string, dataTable: DataTable) {
	this.setCommunityActorName(actorName);
	const actor = actorCalled(actorName);
	const { name: communityName = '' } = dataTable.rowsHash() as { name?: string };

	await actor.attemptsTo(CreateCommunity(this.getCommunityContainer(), communityName));
});

When('{word} attempts to create a community with:', async function (this: CellixUiWorld, actorName: string, dataTable: DataTable) {
	this.setCommunityActorName(actorName);
	const actor = actorCalled(actorName);
	const { name: communityName = '' } = dataTable.rowsHash() as { name?: string };

	await actor.attemptsTo(CreateCommunity(this.getCommunityContainer(), communityName));
});

Then('the community should be created successfully', async function (this: CellixUiWorld) {
	const actor = actorCalled(this.getCommunityActorName());
	const submitted = await actor.answer(CommunityCreatedFlag());

	if (!submitted) {
		throw new Error('Expected community form to be submitted');
	}
});

Then('the community name should be {string}', async function (this: CellixUiWorld, expectedName: string) {
	const actor = actorCalled(this.getCommunityActorName());
	const name = await actor.answer(CommunityName());

	if (name !== expectedName) {
		throw new Error(`Expected community name "${expectedName}" but got "${name}"`);
	}
});

Then('{word} should see a community error for {string}', async function (this: CellixUiWorld, actorName: string, fieldName: string) {
	const resolvedName = /^(she|he|they)$/i.test(actorName) ? this.getCommunityActorName() : actorName;

	const container = this.getCommunityContainer();
	const adapter = new JsdomPageAdapter(container);
	const page = new CommunityPage(adapter) as UiCommunityPage;

	let storedError: string | undefined;
	try {
		const errorEl = await page.firstValidationError;
		if (errorEl) {
			storedError = (await errorEl.textContent()) ?? undefined;
		}
	} catch {
		const actor = actorCalled(resolvedName);
		try {
			storedError = await actor.answer(CommunityErrorMessage());
		} catch {
			// No error found
		}
	}

	if (storedError) {
		const lowerError = storedError.toLowerCase();
		const lowerField = fieldName.toLowerCase();
		const isFieldMentioned = lowerError.includes(lowerField);
		const isValidationPattern = /cannot be empty|required|missing|invalid|must not be empty|please input/i.test(storedError);

		if (!isFieldMentioned && !isValidationPattern) {
			throw new Error(`Expected a validation error related to "${fieldName}", but got: "${storedError}"`);
		}
		return;
	}

	const errorElements = container.querySelectorAll('.ant-form-item-explain-error');
	if (errorElements.length > 0) {
		return;
	}

	throw new Error(`Expected a validation error for "${fieldName}" but none was found`);
});

Then('no community should be created', async function (this: CellixUiWorld) {
	let hasValidationError = false;
	try {
		const actor = actorCalled(this.getCommunityActorName());
		const storedError = await actor.answer(CommunityErrorMessage());
		hasValidationError = !!storedError;
	} catch {
		// No error stored — check DOM
	}

	if (!hasValidationError) {
		const container = this.getCommunityContainer();
		const errorElements = container.querySelectorAll('.ant-form-item-explain-error');
		if (errorElements.length === 0) {
			throw new Error('Expected a validation error to prevent community creation, but no error was found.');
		}
	}
});
