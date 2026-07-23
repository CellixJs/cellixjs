import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import type { MemberNotes, MemberProfileExpectation } from '../notes/member-notes.ts';
import { CommunityIdNamed } from '../questions/community-id-named.ts';
import { MemberById, type MemberByIdResult } from '../questions/member-by-id.ts';
import { UpdateMember } from '../tasks/update-member-profile.ts';

let lastActorName = actors.CommunityOwner.name;

interface MemberProfileUpdateDetails {
	name?: string;
	memberName?: string;
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

When('{word} updates member {string} in {string} with:', async (actorName: string, _memberName: string, communityName: string, dataTable: DataTable) => {
	lastActorName = actorName;

	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<MemberProfileUpdateDetails>();
	const communityId = await actor.answer(CommunityIdNamed.called(communityName));

	const expectedProfile: MemberProfileExpectation = {
		...(details.name ? { name: details.name } : {}),
		...(details.memberName ? { name: details.memberName } : {}),
		...(details.email ? { email: details.email } : {}),
		...(details.bio ? { bio: details.bio } : {}),
		...(details.avatarDocumentId ? { avatarDocumentId: details.avatarDocumentId } : {}),
		...(details.interests
			? {
					interests: details.interests
						.split(',')
						.map((interest) => interest.trim())
						.filter((interest) => interest.length > 0),
				}
			: {}),
		...(details.showInterests !== undefined ? { showInterests: details.showInterests.toLowerCase() === 'true' } : {}),
		...(details.showEmail !== undefined ? { showEmail: details.showEmail.toLowerCase() === 'true' } : {}),
		...(details.showProfile !== undefined ? { showProfile: details.showProfile.toLowerCase() === 'true' } : {}),
		...(details.showLocation !== undefined ? { showLocation: details.showLocation.toLowerCase() === 'true' } : {}),
		...(details.showProperties !== undefined ? { showProperties: details.showProperties.toLowerCase() === 'true' } : {}),
	};

	await actor.attemptsTo(notes<MemberNotes>().set('lastValidationError', undefined as unknown as string), notes<MemberNotes>().set('lastExpectedMemberProfile', expectedProfile));
	await actor.attemptsTo(
		UpdateMember.with({
			communityId,
			profile: expectedProfile,
		}),
	);
});

Then('the member should be updated successfully in {string}', async (communityName: string) => {
	const actor = actorCalled(lastActorName);

	const status = await actor.answer(notes<MemberNotes>().get('lastMemberStatus'));
	const memberId = await actor.answer(notes<MemberNotes>().get('lastMemberId'));
	const validationError = await actor.answer(notes<MemberNotes>().get('lastValidationError'));
	const expectedCommunityId = await actor.answer(CommunityIdNamed.called(communityName));

	if (validationError) {
		throw new Error(`Expected member update to succeed for "${communityName}", but got validation error: "${validationError}"`);
	}

	if (status !== 'SUCCESS') {
		throw new Error(`Expected member status "SUCCESS" but got "${status}"`);
	}

	if (!memberId) {
		throw new Error(`Expected an updated member id for "${communityName}" but none was recorded`);
	}

	const updatedMember = await actor.answer(MemberById.withId(memberId));
	if (!updatedMember) {
		throw new Error(`Expected member "${memberId}" to exist after update, but no member was returned by API`);
	}

	if (String(updatedMember.community?.id ?? '') !== String(expectedCommunityId)) {
		throw new Error(`Expected updated member to belong to "${communityName}"`);
	}

	const expectedProfile = await actor.answer(notes<MemberNotes>().get('lastExpectedMemberProfile')).catch(() => undefined);
	if (!expectedProfile) {
		return;
	}

	const actualProfile = updatedMember.profile;
	if (!actualProfile) {
		throw new Error('Expected updated member profile to be returned by API, but profile was missing');
	}

	assertMemberProfileMatches(expectedProfile, actualProfile);
});

function assertMemberProfileMatches(expectedProfile: MemberProfileExpectation, actualProfile: NonNullable<MemberByIdResult['profile']>): void {
	const comparableFields: Array<Exclude<keyof MemberProfileExpectation, 'interests'>> = ['name', 'email', 'bio', 'avatarDocumentId', 'showInterests', 'showEmail', 'showProfile', 'showLocation', 'showProperties'];

	for (const field of comparableFields) {
		const expectedValue = expectedProfile[field];
		if (expectedValue === undefined) {
			continue;
		}

		const actualValue = actualProfile[field];
		if (actualValue !== expectedValue) {
			throw new Error(`Expected profile ${field} to be "${String(expectedValue)}" but got "${String(actualValue ?? '')}"`);
		}
	}

	if (expectedProfile.interests !== undefined) {
		const expectedInterests = JSON.stringify(expectedProfile.interests);
		const actualInterests = JSON.stringify(actualProfile.interests ?? []);
		if (actualInterests !== expectedInterests) {
			throw new Error(`Expected profile interests ${expectedInterests} but got ${actualInterests}`);
		}
	}
}
