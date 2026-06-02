import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { Render, RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { CommunityPage } from '@ocom-verification/verification-shared/pages';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import { CommunityCreate } from '../../../../../../ocom/ui-community-route-accounts/src/components/community-create.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import type { AcceptanceUiCommunityPage } from '../../../shared/page-contracts.ts';
import type { CommunityUiNotes } from '../notes/community-notes.ts';
import { CommunityCreatedFlag } from '../questions/community-created-flag.ts';
import { CommunityName } from '../questions/community-name.ts';
import { CreateCommunity } from '../tasks/create-community.ts';

Given('{word} is an authenticated community owner', async (actorName: string) => {
	const actor = actorCalled(actorName);

	const onSave = async (values: { name: string }): Promise<void> => {
		await actor.attemptsTo(notes<CommunityUiNotes>().set('formSubmitted', true), notes<CommunityUiNotes>().set('communityName', values.name ?? ''));
	};

	await actor.attemptsTo(notes<CommunityUiNotes>().set('formSubmitted', false), notes<CommunityUiNotes>().set('communityName', ''), Render.component(<CommunityCreate onSave={onSave} />, { wrapper: wrapOcomComponent() }));
});

When('{word} creates a community with:', async (actorName: string, dataTable: DataTable) => {
	const { name: communityName = '' } = GherkinDataTable.from(dataTable).rowsHash<{ name?: string }>();
	await actorCalled(actorName).attemptsTo(CreateCommunity(communityName));
});

When('{word} attempts to create a community with:', async (actorName: string, dataTable: DataTable) => {
	const { name: communityName = '' } = GherkinDataTable.from(dataTable).rowsHash<{ name?: string }>();
	await actorCalled(actorName).attemptsTo(CreateCommunity(communityName));
});

Then('the community should be created successfully', async () => {
	const submitted = await actorInTheSpotlight().answer(CommunityCreatedFlag());
	if (!submitted) {
		throw new Error('Expected community form to be submitted');
	}
});

Then('the community name should be {string}', async (expectedName: string) => {
	const name = await actorInTheSpotlight().answer(CommunityName());
	if (name !== expectedName) {
		throw new Error(`Expected community name "${expectedName}" but got "${name}"`);
	}
});

Then('{word} should see a community error for {string}', async (_actorName: string, fieldName: string) => {
	const actor = actorInTheSpotlight();
	const page: AcceptanceUiCommunityPage = new CommunityPage(new DomPageAdapter(RenderInDom.as(actor).container));
	const errorText = (await page.firstValidationError.textContent()) ?? '';

	const isFieldMentioned = errorText.toLowerCase().includes(fieldName.toLowerCase());
	const isValidationPattern = /cannot be empty|required|missing|invalid|must not be empty|please input/i.test(errorText);

	if (!errorText || (!isFieldMentioned && !isValidationPattern)) {
		throw new Error(`Expected a validation error related to "${fieldName}", but got: "${errorText}"`);
	}
});

Then('no community should be created', async () => {
	const submitted = await actorInTheSpotlight().answer(CommunityCreatedFlag());
	if (submitted) {
		throw new Error('Expected no community to be created, but the form was submitted');
	}
});
