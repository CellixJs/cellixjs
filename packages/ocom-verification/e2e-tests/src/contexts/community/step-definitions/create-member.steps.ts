import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import { LogInWithOAuth2 } from '../../../shared/abilities/oauth2-login.ts';
import { clearKnownQueueMessages } from '../../../shared/support/queue-storage.ts';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { MemberBelongsToCommunity } from '../questions/member-belongs-to-community.ts';
import { MemberCreatedFlag } from '../questions/member-created-flag.ts';
import { CreateCommunity } from '../tasks/create-community.ts';
import { CreateMember } from '../tasks/create-member.ts';

interface MemberDetails {
	memberName?: string;
}

const seededEndUserLabelMap: Record<string, keyof typeof actors> = {
	Charlie: 'CommunityMember',
};

let lastActorName = actors.CommunityOwner.name;

Given('{word} is signed in as a community owner for member management', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);

	await clearKnownQueueMessages();
	await actor.attemptsTo(LogInWithOAuth2(actors.CommunityOwner.email));
});

Given('{word} has a community named {string}', async (actorName: string, communityName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);

	await actor.attemptsTo(CreateCommunity(communityName));

	const communityId = (await actor.answer(notes<CommunityE2ENotes>().get('communityId'))) as string | null;
	if (!communityId) {
		throw new Error(`Expected created community id for "${communityName}" but none was recorded`);
	}

	const existingCommunityIdsByName = (await actor.answer(notes<MemberE2ENotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>)) as Record<string, string>;
	await actor.attemptsTo(
		notes<MemberE2ENotes>().set('communityIdsByName', {
			...existingCommunityIdsByName,
			[communityName]: communityId,
		}),
	);
});

Given('{word} is an existing end-user account', async (label: string) => {
	const actorKey = seededEndUserLabelMap[label];
	if (!actorKey) {
		throw new Error(`No seeded end-user mapping for label "${label}"`);
	}

	const seeded = actors[actorKey];
	const actor = actorCalled(lastActorName);
	const existingExternalIds = (await actor.answer(notes<MemberE2ENotes>().get('endUserExternalIdsByLabel')).catch(() => ({}) as Record<string, string>)) as Record<string, string>;
	const existingEmails = (await actor.answer(notes<MemberE2ENotes>().get('endUserEmailsByLabel')).catch(() => ({}) as Record<string, string>)) as Record<string, string>;

	await actor.attemptsTo(
		notes<MemberE2ENotes>().set('endUserExternalIdsByLabel', {
			...existingExternalIds,
			[label]: seeded.externalId,
		}),
		notes<MemberE2ENotes>().set('endUserEmailsByLabel', {
			...existingEmails,
			[label]: seeded.email,
		}),
	);
});

When('{word} creates a member in {string} with:', async (actorName: string, communityName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);

	const details = GherkinDataTable.from(dataTable).rowsHash<MemberDetails>();
	const memberName = details.memberName?.trim() ?? '';
	if (!memberName) {
		throw new Error('memberName is required');
	}

	await actor.attemptsTo(
		notes<MemberE2ENotes>().set('lastMemberId', null),
		notes<MemberE2ENotes>().set('lastMemberCommunityId', null),
		notes<MemberE2ENotes>().set('lastMemberName', memberName),
		notes<MemberE2ENotes>().set('memberCreated', false),
		notes<MemberE2ENotes>().set('errorMessage', null),
	);

	await actor.attemptsTo(CreateMember(communityName, memberName));
});

Then('the member should be created successfully in {string}', async (communityName: string) => {
	const actor = actorCalled(lastActorName);

	const memberCreated = await actor.answer(MemberCreatedFlag());
	const validationError = await actor.answer(notes<MemberE2ENotes>().get('errorMessage')).catch(() => null);
	const communityIdsByName = (await actor.answer(notes<MemberE2ENotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>)) as Record<string, string>;
	const expectedCommunityId = communityIdsByName[communityName];
	const actualCommunityId = (await actor.answer(notes<MemberE2ENotes>().get('lastMemberCommunityId')).catch(() => null)) as string | null;
	const memberId = (await actor.answer(notes<MemberE2ENotes>().get('lastMemberId')).catch(() => null)) as string | null;

	if (!expectedCommunityId) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

	if (validationError) {
		throw new Error(`Expected member creation to succeed for "${communityName}", but got: "${validationError}"`);
	}

	if (!memberCreated) {
		throw new Error(`Expected member creation to succeed for "${communityName}"`);
	}

	if (!memberId) {
		throw new Error(`Expected a created member id for "${communityName}" but none was recorded`);
	}

	if (actualCommunityId !== expectedCommunityId) {
		throw new Error(`Expected created member communityId "${expectedCommunityId}" but got "${actualCommunityId ?? 'null'}"`);
	}
});

Then('the member {string} should belong to {string}', async (memberName: string, communityName: string) => {
	const actor = actorCalled(lastActorName);
	const belongs = await actor.answer(MemberBelongsToCommunity(memberName, communityName));

	if (!belongs) {
		throw new Error(`Expected member "${memberName}" to belong to "${communityName}"`);
	}
});
