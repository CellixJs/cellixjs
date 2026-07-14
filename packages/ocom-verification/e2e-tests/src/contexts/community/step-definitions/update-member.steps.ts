import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import type { MemberE2ENotes, MemberProfileExpectation } from '../notes/member-notes.ts';
import { UpdateMemberProfile } from '../tasks/update-member-profile.ts';

let lastActorName = actors.CommunityOwner.name;

type MemberProfileUpdateDetails = Partial<Record<keyof MemberProfileExpectation | 'memberName', string>>;

const parseBoolean = (value: string): boolean => value.trim().toLowerCase() === 'true';

When('{word} updates member {string} in {string} with:', async (actorName: string, memberName: string, communityName: string, dataTable: DataTable) => {
	lastActorName = actorName;

	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<MemberProfileUpdateDetails>();
	const communityIdsByName = (await actor.answer(notes<MemberE2ENotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>)) as Record<string, string>;

	if (!communityIdsByName[communityName]) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

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
		...(details.showInterests !== undefined ? { showInterests: parseBoolean(details.showInterests) } : {}),
		...(details.showEmail !== undefined ? { showEmail: parseBoolean(details.showEmail) } : {}),
		...(details.showProfile !== undefined ? { showProfile: parseBoolean(details.showProfile) } : {}),
		...(details.showLocation !== undefined ? { showLocation: parseBoolean(details.showLocation) } : {}),
		...(details.showProperties !== undefined ? { showProperties: parseBoolean(details.showProperties) } : {}),
	};

	await actor.attemptsTo(notes<MemberE2ENotes>().set('memberUpdated', false), notes<MemberE2ENotes>().set('errorMessage', null));

	await actor.attemptsTo(
		UpdateMemberProfile({
			communityName,
			memberName,
			profile: expectedProfile,
		}),
	);
});

Then('the member should be updated successfully in {string}', async (_communityName: string) => {
	const actor = actorCalled(lastActorName);
	const updated = await actor.answer(notes<MemberE2ENotes>().get('memberUpdated'));
	if (!updated) {
		throw new Error('Expected member update to succeed');
	}
});
