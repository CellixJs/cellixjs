import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import { LogInWithOAuth2 } from '../../../shared/abilities/oauth2-login.ts';
import { clearKnownQueueMessages } from '../../../shared/support/queue-storage.ts';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { MemberCreatedFlag } from '../questions/member-created-flag.ts';
import { MemberErrorMessage } from '../questions/member-error-message.ts';
import { CreateCommunity } from '../tasks/create-community.ts';
import { CreateMember } from '../tasks/create-member.ts';

interface MemberDetails {
	memberName?: string;
}

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

When('{word} creates a member in {string} with:', async (actorName: string, communityName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);

	const details = GherkinDataTable.from(dataTable).rowsHash<MemberDetails>();
	const memberName = details.memberName?.trim() ?? '';
	if (!memberName) {
		throw new Error('memberName is required');
	}

	await actor.attemptsTo(notes<MemberE2ENotes>().set('lastMemberId', null), notes<MemberE2ENotes>().set('memberCreated', false), notes<MemberE2ENotes>().set('errorMessage', null));

	await actor.attemptsTo(CreateMember(communityName, memberName));
});

Then('the member should be created successfully in {string}', async (_communityName: string) => {
	const actor = actorCalled(lastActorName);
	const created = await actor.answer(MemberCreatedFlag());
	if (!created) {
		throw new Error('Expected member creation to succeed');
	}
});

When('{word} attempts to create a member in {string} with:', async (actorName: string, communityName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<MemberDetails>();
	await actor.attemptsTo(notes<MemberE2ENotes>().set('lastMemberId', null), notes<MemberE2ENotes>().set('memberCreated', false), notes<MemberE2ENotes>().set('errorMessage', null));
	try {
		await actor.attemptsTo(CreateMember(communityName, details.memberName?.trim() ?? ''));
	} catch (error) {
		await actor.attemptsTo(notes<MemberE2ENotes>().set('errorMessage', error instanceof Error ? error.message : String(error)));
	}
});

Then('she should see a member error for {string}', async (fieldName: string) => {
	const error = await actorCalled(lastActorName).answer(MemberErrorMessage());
	if (!error || !/cannot be empty|required|missing|invalid|must not be empty|please input/i.test(error)) {
		throw new Error(`Expected a validation error related to "${fieldName}", but got: "${error}"`);
	}
});

Then('no new member should be created in {string}', async (_communityName: string) => {
	if (await actorCalled(lastActorName).answer(MemberCreatedFlag())) {
		throw new Error('Expected no member to be created, but one was created');
	}
});
