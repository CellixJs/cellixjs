import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import type { MemberProfileExpectation, MemberProfileFormValues, MemberUiNotes } from '../notes/member-notes.ts';
import { MemberUpdatedFlag, UpdatedMemberProfile } from '../questions/member-profile-updated.ts';
import { UpdateMemberProfile } from '../tasks/update-member-profile.ts';

interface MemberProfileUpdateDetails {
	name?: string;
	email?: string;
	bio?: string;
	avatarDocumentId?: string;
	interests?: string;
	showInterests?: string;
	showEmail?: string;
	showProfile?: string;
	showLocation?: string;
	showProperties?: string;
}

When('{word} updates member {string} in {string} with:', async (actorName: string, _memberName: string, _communityName: string, dataTable: DataTable) => {
	const actor = actorCalled(actorName);
	const profile = toMemberProfileExpectation(GherkinDataTable.from(dataTable).rowsHash<MemberProfileUpdateDetails>());

	await actor.attemptsTo(notes<MemberUiNotes>().set('memberUpdated', false), notes<MemberUiNotes>().set('expectedMemberProfile', profile), UpdateMemberProfile(profile));
});

Then('the member should be updated successfully in {string}', async (_communityName: string) => {
	const actor = actorInTheSpotlight();
	const updated = await actor.answer(MemberUpdatedFlag());
	if (!updated) {
		throw new Error('Expected member profile form to be submitted');
	}

	assertProfileMatches(await actor.answer(notes<MemberUiNotes>().get('expectedMemberProfile')), await actor.answer(UpdatedMemberProfile()));
});

function toMemberProfileExpectation(details: MemberProfileUpdateDetails): MemberProfileExpectation {
	return {
		name: details.name ?? '',
		email: details.email ?? '',
		bio: details.bio ?? '',
		showInterests: toBoolean(details.showInterests),
		showEmail: toBoolean(details.showEmail),
		showProfile: toBoolean(details.showProfile),
		showLocation: toBoolean(details.showLocation),
		showProperties: toBoolean(details.showProperties),
	};
}

function toBoolean(value: string | undefined): boolean {
	return value?.trim().toLowerCase() === 'true';
}

function assertProfileMatches(expected: MemberProfileExpectation, actual: MemberProfileFormValues): void {
	for (const [field, expectedValue] of Object.entries(expected)) {
		const actualValue = actual[field as keyof MemberProfileFormValues];
		if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
			throw new Error(`Expected profile ${field} to be ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(actualValue)}`);
		}
	}
}
