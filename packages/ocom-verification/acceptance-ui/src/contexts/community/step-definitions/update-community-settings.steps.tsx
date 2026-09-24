import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { Render } from '@cellix/serenity-framework/dom/render-in-dom';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { SEEDED_COMMUNITY } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import { SettingsGeneral } from '../../../../../../ocom/ui-community-route-admin/src/components/settings-general.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import type { CommunityUiNotes } from '../notes/community-notes.ts';
import { CommunityName } from '../questions/community-name.ts';
import { CommunitySettingsSavedFlag, SubmittedDomain, SubmittedHandle, SubmittedWhiteLabelDomain } from '../questions/community-settings.ts';
import { type CommunitySettingsFormDetails, UpdateCommunitySettings } from '../tasks/update-community-settings.ts';
import { ViewCommunitySettings } from '../tasks/view-community-settings.ts';

interface SubmittedSettingsValues {
	name?: string | null | undefined;
	whiteLabelDomain?: string | null | undefined;
	domain?: string | null | undefined;
	handle?: string | null | undefined;
}

// antd's onFinish does not await onSave, so submitted values are captured
// synchronously here and copied into actor notes by the awaited When steps.
const submittedSettingsByActor = new Map<string, SubmittedSettingsValues>();

Given('{word} is an authenticated admin of the seeded community', async (actorName: string) => {
	const actor = actorCalled(actorName);
	submittedSettingsByActor.delete(actorName);

	const onSave = (values: SubmittedSettingsValues): Promise<void> => {
		submittedSettingsByActor.set(actorName, values);
		return Promise.resolve();
	};

	const seededCommunityData = {
		id: SEEDED_COMMUNITY.id,
		name: SEEDED_COMMUNITY.name,
		domain: null,
		whiteLabelDomain: null,
		handle: null,
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-01T00:00:00.000Z',
	};

	await actor.attemptsTo(
		notes<CommunityUiNotes>().set('settingsSaved', false),
		notes<CommunityUiNotes>().set('communityName', ''),
		notes<CommunityUiNotes>().set('submittedWhiteLabelDomain', ''),
		notes<CommunityUiNotes>().set('submittedDomain', ''),
		notes<CommunityUiNotes>().set('submittedHandle', ''),
		Render.component(
			<SettingsGeneral
				data={seededCommunityData}
				onSave={onSave}
			/>,
			{ wrapper: wrapOcomComponent() },
		),
	);
});

When('{word} views the current community', async (actorName: string) => {
	await actorCalled(actorName).attemptsTo(ViewCommunitySettings());
});

async function recordSubmittedSettings(actorName: string): Promise<void> {
	const actor = actorCalled(actorName);
	const submitted = submittedSettingsByActor.get(actorName);
	if (!submitted) {
		return;
	}

	await actor.attemptsTo(
		notes<CommunityUiNotes>().set('settingsSaved', true),
		notes<CommunityUiNotes>().set('communityName', submitted.name ?? ''),
		notes<CommunityUiNotes>().set('submittedWhiteLabelDomain', submitted.whiteLabelDomain ?? ''),
		notes<CommunityUiNotes>().set('submittedDomain', submitted.domain ?? ''),
		notes<CommunityUiNotes>().set('submittedHandle', submitted.handle ?? ''),
	);
}

When('{word} updates the community settings with:', async (actorName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<CommunitySettingsFormDetails>();
	await actorCalled(actorName).attemptsTo(UpdateCommunitySettings(details));
	await recordSubmittedSettings(actorName);
});

When('{word} attempts to update the community settings with:', async (actorName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<CommunitySettingsFormDetails>();
	await actorCalled(actorName).attemptsTo(UpdateCommunitySettings(details));
	await recordSubmittedSettings(actorName);
});

Then('the community settings update should succeed', async () => {
	const saved = await actorInTheSpotlight().answer(CommunitySettingsSavedFlag());
	if (!saved) {
		throw new Error('Expected the community settings form to be saved');
	}
});

Then('{word} should see the community name {string}', async (_actorName: string, expectedName: string) => {
	const name = await actorInTheSpotlight().answer(CommunityName());
	if (name !== expectedName) {
		throw new Error(`Expected the displayed community name "${expectedName}" but got "${name}"`);
	}
});

Then('the community white label domain should be {string}', async (expectedValue: string) => {
	const value = await actorInTheSpotlight().answer(SubmittedWhiteLabelDomain());
	if (value !== expectedValue) {
		throw new Error(`Expected the saved white label domain "${expectedValue}" but got "${value}"`);
	}
});

Then('the community domain should be {string}', async (expectedValue: string) => {
	const value = await actorInTheSpotlight().answer(SubmittedDomain());
	if (value !== expectedValue) {
		throw new Error(`Expected the saved domain "${expectedValue}" but got "${value}"`);
	}
});

Then('the community handle should be {string}', async (expectedValue: string) => {
	const value = await actorInTheSpotlight().answer(SubmittedHandle());
	if (value !== expectedValue) {
		throw new Error(`Expected the saved handle "${expectedValue}" but got "${value}"`);
	}
});

Then('the community should not be modified', async () => {
	const saved = await actorInTheSpotlight().answer(CommunitySettingsSavedFlag());
	if (saved) {
		throw new Error('Expected the community settings form not to be saved, but it was');
	}
});
