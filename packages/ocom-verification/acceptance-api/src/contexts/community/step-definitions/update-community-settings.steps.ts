import { ActorName } from '@cellix/serenity-framework/cucumber/actor-name';
import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { COMMUNITY_IDS, MEMBER_IDS, SEEDED_COMMUNITY } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import { endUserTokenFor, setActorHints, setActorToken, staffTokenFor } from '../../../shared/abilities/actor-auth.ts';
import { QueryCommunity } from '../../../shared/abilities/query-community.ts';
import type { CommunityNotes, CommunitySettingsDetails } from '../notes/community-notes.ts';
import { CommunityField } from '../questions/community-field.ts';
import { CommunityStatus } from '../questions/community-status.ts';
import { ViewedCommunityName } from '../questions/viewed-community-name.ts';
import { UpdateCommunitySettings } from '../tasks/update-community-settings.ts';
import { ViewCommunityDetails } from '../tasks/view-community-details.ts';
import { ViewCurrentCommunity } from '../tasks/view-current-community.ts';
import { getLastActorName, setLastActorName } from './last-actor.ts';

async function noteSeededCommunityAsTarget(actorName: string): Promise<void> {
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<CommunityNotes>().set('lastCommunityId', SEEDED_COMMUNITY.id));
}

Given('{word} is an authenticated admin of the seeded community', async (actorName: string) => {
	setLastActorName(actorName);
	// The CommunityOwner principal (default token) acting through their admin membership.
	setActorHints(actorName, { memberId: MEMBER_IDS.seededAdminMember, communityId: COMMUNITY_IDS.seededCommunity });
	await noteSeededCommunityAsTarget(actorName);
});

Given('{word} is an authenticated member of the seeded community without settings permissions', async (actorName: string) => {
	setLastActorName(actorName);
	setActorToken(actorName, endUserTokenFor('CommunityMember'));
	setActorHints(actorName, { memberId: MEMBER_IDS.seededPlainMember, communityId: COMMUNITY_IDS.seededCommunity });
	await noteSeededCommunityAsTarget(actorName);
});

Given('{word} is an authenticated admin of the other community', async (actorName: string) => {
	setLastActorName(actorName);
	// An admin of the *other* community browsing their own community portal.
	setActorToken(actorName, endUserTokenFor('CommunityMember'));
	setActorHints(actorName, { memberId: MEMBER_IDS.otherCommunityAdminMember, communityId: COMMUNITY_IDS.otherCommunity });
	await noteSeededCommunityAsTarget(actorName);
});

Given('{word} is a staff user who can manage all communities', async (actorName: string) => {
	setLastActorName(actorName);
	setActorToken(actorName, staffTokenFor('TechAdminStaff'));
	await noteSeededCommunityAsTarget(actorName);
});

Given('{word} is a staff user who cannot manage all communities', async (actorName: string) => {
	setLastActorName(actorName);
	setActorToken(actorName, staffTokenFor('CaseManagerStaff'));
	await noteSeededCommunityAsTarget(actorName);
});

Given('{word} is an unauthenticated guest', async (actorName: string) => {
	setLastActorName(actorName);
	setActorToken(actorName, null);
	await noteSeededCommunityAsTarget(actorName);
});

When('{word} views the current community', async (actorName: string) => {
	setLastActorName(actorName);
	const actor = actorCalled(actorName);

	await actor.attemptsTo(ViewCurrentCommunity.now());
});

When('{word} views the details of the seeded community', async (actorName: string) => {
	setLastActorName(actorName);
	const actor = actorCalled(actorName);

	await actor.attemptsTo(ViewCommunityDetails.ofSeededCommunity());
});

When('{word} updates the community settings with:', async (actorName: string, dataTable: DataTable) => {
	setLastActorName(actorName);
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<CommunitySettingsDetails>();

	await actor.attemptsTo(UpdateCommunitySettings.with(details));
});

When('{word} attempts to update the community settings with:', async (actorName: string, dataTable: DataTable) => {
	const details = GherkinDataTable.from(dataTable).rowsHash<CommunitySettingsDetails>();
	await attemptCommunitySettingsUpdate(actorName, details);
});

When('{word} attempts to update the community settings with a name of {int} characters', async (actorName: string, nameLength: number) => {
	await attemptCommunitySettingsUpdate(actorName, { name: 'A'.repeat(nameLength) });
});

async function attemptCommunitySettingsUpdate(actorName: string, details: CommunitySettingsDetails): Promise<void> {
	setLastActorName(actorName);
	const actor = actorCalled(actorName);

	await actor.attemptsTo(notes<CommunityNotes>().set('lastCommunityStatus', undefined as unknown as string), notes<CommunityNotes>().set('lastValidationError', undefined as unknown as string));

	try {
		await actor.attemptsTo(UpdateCommunitySettings.with(details));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		await actor.attemptsTo(notes<CommunityNotes>().set('lastValidationError', errorMessage));
	}
}

Then('the community settings update should succeed', async () => {
	const actor = actorCalled(getLastActorName());
	const status = await actor.answer(CommunityStatus.of());

	if (status !== 'SUCCESS') {
		throw new Error(`Expected community update status "SUCCESS" but got "${status}"`);
	}
});

Then('the community white label domain should be {string}', async (expectedValue: string) => {
	await verifyCommunityField('whiteLabelDomain', expectedValue);
});

Then('the community domain should be {string}', async (expectedValue: string) => {
	await verifyCommunityField('domain', expectedValue);
});

Then('the community handle should be {string}', async (expectedValue: string) => {
	await verifyCommunityField('handle', expectedValue);
});

async function verifyCommunityField(fieldName: 'domain' | 'whiteLabelDomain' | 'handle', expectedValue: string): Promise<void> {
	const actor = actorCalled(getLastActorName());
	const actualValue = await actor.answer(CommunityField.named(fieldName));

	if (actualValue !== expectedValue) {
		throw new Error(`Expected community ${fieldName} "${expectedValue}" but got "${actualValue}"`);
	}
}

Then('{word} should see the community name {string}', async (actorName: string, expectedName: string) => {
	const resolvedActorName = ActorName.resolve(actorName, { defaultName: getLastActorName() });
	const actor = actorCalled(resolvedActorName);
	const viewedName = await actor.answer(ViewedCommunityName.displayed());

	if (viewedName !== expectedName) {
		throw new Error(`Expected the viewed community name "${expectedName}" but got "${viewedName}"`);
	}
});

Then('{word} should see a community error containing {string}', async (actorName: string, expectedFragment: string) => {
	const resolvedActorName = ActorName.resolve(actorName, { defaultName: getLastActorName() });
	const actor = actorCalled(resolvedActorName);

	let storedError: string | undefined;
	try {
		storedError = await actor.answer(notes<CommunityNotes>().get('lastValidationError'));
	} catch {
		// No error in notes
	}

	if (!storedError) {
		throw new Error(`Expected a community error containing "${expectedFragment}" but none was captured`);
	}

	if (!storedError.toLowerCase().includes(expectedFragment.toLowerCase())) {
		throw new Error(`Expected a community error containing "${expectedFragment}" but got: "${storedError}"`);
	}
});

Then('the community update should be rejected as unauthorized', async () => {
	const actor = actorCalled(getLastActorName());

	let storedError: string | undefined;
	try {
		storedError = await actor.answer(notes<CommunityNotes>().get('lastValidationError'));
	} catch {
		// No error in notes
	}

	if (!storedError) {
		throw new Error('Expected the community update to be rejected as unauthorized, but no error was captured');
	}

	if (!/unauthorized/i.test(storedError)) {
		throw new Error(`Expected an unauthorized rejection but got: "${storedError}"`);
	}
});

Then('the community should not be modified', async () => {
	// Verify through an independently authenticated actor so the assertion works
	// even when the scenario actor is unauthenticated or under-privileged.
	const verifier = actorCalled('CommunityBaselineVerifier');
	const community = await QueryCommunity.as(verifier).byId(verifier, SEEDED_COMMUNITY.id);

	if (!community) {
		throw new Error(`The seeded community "${SEEDED_COMMUNITY.id}" was not found through the API`);
	}

	if (community.name !== SEEDED_COMMUNITY.name) {
		throw new Error(`Expected the seeded community to keep its name "${SEEDED_COMMUNITY.name}", but it is now "${community.name}"`);
	}
});
