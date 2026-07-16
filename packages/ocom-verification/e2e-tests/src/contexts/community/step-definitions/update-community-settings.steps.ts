import { ActorName } from '@cellix/serenity-framework/cucumber/actor-name';
import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { MEMBER_IDS, SEEDED_COMMUNITY } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import { communityPortalPageFor } from '../../../shared/abilities/community-portal-session.ts';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';
import { CommunityErrorMessage } from '../questions/community-error-message.ts';
import { CommunitySettingsSavedFlag, DisplayedCommunityName, SavedDomain, SavedHandle, SavedWhiteLabelDomain } from '../questions/community-settings.ts';
import type { CommunitySettingsFormDetails } from '../tasks/update-community-settings.ts';
import { UpdateCommunitySettings } from '../tasks/update-community-settings.ts';
import { ViewCommunitySettings } from '../tasks/view-community-settings.ts';
import { getLastActorName, setLastActorName } from './last-actor.ts';

Given('{word} is an authenticated admin of the seeded community', async (actorName: string) => {
	setLastActorName(actorName);
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<CommunityE2ENotes>().set('portalUser', 'owner'), notes<CommunityE2ENotes>().set('memberId', MEMBER_IDS.seededAdminMember));
	await communityPortalPageFor('owner');
});

Given('{word} is an authenticated member of the seeded community without settings permissions', async (actorName: string) => {
	setLastActorName(actorName);
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<CommunityE2ENotes>().set('portalUser', 'member'), notes<CommunityE2ENotes>().set('memberId', MEMBER_IDS.seededPlainMember));
	await communityPortalPageFor('member');
});

When('{word} views the current community', async (actorName: string) => {
	setLastActorName(actorName);
	const actor = actorCalled(actorName);
	await actor.attemptsTo(ViewCommunitySettings());
});

When('{word} updates the community settings with:', async (actorName: string, dataTable: DataTable) => {
	setLastActorName(actorName);
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<CommunitySettingsFormDetails>();

	await actor.attemptsTo(UpdateCommunitySettings(details));
});

When('{word} attempts to update the community settings with:', async (actorName: string, dataTable: DataTable) => {
	setLastActorName(actorName);
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<CommunitySettingsFormDetails>();

	await actor.attemptsTo(notes<CommunityE2ENotes>().set('settingsSaved', false), notes<CommunityE2ENotes>().set('errorMessage', null));
	try {
		await actor.attemptsTo(UpdateCommunitySettings(details));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		await actor.attemptsTo(notes<CommunityE2ENotes>().set('settingsSaved', false), notes<CommunityE2ENotes>().set('errorMessage', errorMessage));
	}
});

Then('the community settings update should succeed', async () => {
	const actor = actorCalled(getLastActorName());
	const saved = await actor.answer(CommunitySettingsSavedFlag());

	if (!saved) {
		const errorMessage = await actor.answer(CommunityErrorMessage());
		throw new Error(`Expected the community settings update to succeed${errorMessage ? `, but it failed with: ${errorMessage}` : ''}`);
	}
});

Then('{word} should see the community name {string}', async (actorName: string, expectedName: string) => {
	const resolvedName = ActorName.resolve(actorName, { defaultName: getLastActorName() });
	const actor = actorCalled(resolvedName);
	const displayedName = await actor.answer(DisplayedCommunityName());

	if (displayedName !== expectedName) {
		throw new Error(`Expected the displayed community name to be "${expectedName}" but got "${displayedName}"`);
	}
});

Then('the community white label domain should be {string}', async (expectedValue: string) => {
	const actor = actorCalled(getLastActorName());
	const actualValue = await actor.answer(SavedWhiteLabelDomain());

	if (actualValue !== expectedValue) {
		throw new Error(`Expected the community white label domain to be "${expectedValue}" but got "${actualValue}"`);
	}
});

Then('the community domain should be {string}', async (expectedValue: string) => {
	const actor = actorCalled(getLastActorName());
	const actualValue = await actor.answer(SavedDomain());

	if (actualValue !== expectedValue) {
		throw new Error(`Expected the community domain to be "${expectedValue}" but got "${actualValue}"`);
	}
});

Then('the community handle should be {string}', async (expectedValue: string) => {
	const actor = actorCalled(getLastActorName());
	const actualValue = await actor.answer(SavedHandle());

	if (actualValue !== expectedValue) {
		throw new Error(`Expected the community handle to be "${expectedValue}" but got "${actualValue}"`);
	}
});

Then('{word} should see a community error containing {string}', async (actorName: string, expectedFragment: string) => {
	const resolvedName = ActorName.resolve(actorName, { defaultName: getLastActorName() });
	const actor = actorCalled(resolvedName);
	const errorMessage = await actor.answer(CommunityErrorMessage());

	if (!errorMessage) {
		throw new Error(`Expected a community error containing "${expectedFragment}" but none was recorded`);
	}

	if (!errorMessage.toLowerCase().includes(expectedFragment.toLowerCase())) {
		throw new Error(`Expected the community error to contain "${expectedFragment}", but got: "${errorMessage}"`);
	}
});

Then('the community should not be modified', async () => {
	const actor = actorCalled(getLastActorName());

	// Reload the settings screen as the seeded admin so the assertion reads the
	// persisted community state rather than unsaved local form edits.
	await actor.attemptsTo(notes<CommunityE2ENotes>().set('portalUser', 'owner'), notes<CommunityE2ENotes>().set('memberId', MEMBER_IDS.seededAdminMember), ViewCommunitySettings());
	const displayedName = await actor.answer(DisplayedCommunityName());

	if (displayedName !== SEEDED_COMMUNITY.name) {
		throw new Error(`Expected the community to remain "${SEEDED_COMMUNITY.name}" but the settings screen shows "${displayedName}"`);
	}
});
