import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import type { MemberNotes } from '../notes/member-notes.ts';
import { MemberStatus } from '../questions/member-status.ts';
import { CreateCommunity } from '../tasks/create-community.ts';
import { CreateMember } from '../tasks/create-member.ts';

let lastActorName = actors.CommunityOwner.name;

interface MemberDetails {
	memberName?: string;
	email?: string;
}

Given('{word} is signed in as a community owner for member management', (actorName: string) => {
	lastActorName = actorName;
	actorCalled(actorName);
});

Given('{word} has a community named {string}', async (actorName: string, communityName: string) => {
	lastActorName = actorName;

	const actor = actorCalled(actorName);
	await actor.attemptsTo(CreateCommunity.withName(communityName));

	const communityId = (await actor.answer(notes().get('lastCommunityId'))) as string;
	const existing = await actor.answer(notes<MemberNotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>);

	await actor.attemptsTo(
		notes<MemberNotes>().set('communityIdsByName', {
			...existing,
			[communityName]: communityId,
		}),
	);
});

When('{word} creates a member in {string} with:', async (actorName: string, communityName: string, dataTable: DataTable) => {
	lastActorName = actorName;

	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<MemberDetails>();

	const memberName = details.memberName?.trim() ?? '';

	const communityIdsByName = await actor.answer(notes<MemberNotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>);

	const communityId = communityIdsByName[communityName];
	if (!communityId) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

	await actor.attemptsTo(
		CreateMember.with({
			memberName,
			communityId,
		}),
	);
});

When('{word} attempts to create a member in {string} with:', async (actorName: string, communityName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<MemberDetails>();
	const communityIdsByName = await actor.answer(notes<MemberNotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>);
	const communityId = communityIdsByName[communityName];
	if (!communityId) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

	await actor.attemptsTo(
		notes<MemberNotes>().set('lastMemberId', undefined as unknown as string),
		notes<MemberNotes>().set('lastMemberStatus', undefined as unknown as string),
		notes<MemberNotes>().set('lastValidationError', undefined as unknown as string),
	);

	try {
		await actor.attemptsTo(CreateMember.with({ memberName: details.memberName?.trim() ?? '', communityId }));
	} catch (error) {
		await actor.attemptsTo(notes<MemberNotes>().set('lastValidationError', error instanceof Error ? error.message : String(error)));
	}
});

Then('the member should be created successfully in {string}', async (_communityName: string) => {
	const actor = actorCalled(lastActorName);
	const status = await actor.answer(MemberStatus.of());
	if (status !== 'SUCCESS') {
		throw new Error(`Expected member status "SUCCESS" but got "${status}"`);
	}
});

Then('she should see a member error for {string}', async (fieldName: string) => {
	const actor = actorCalled(lastActorName);
	const error = await actor.answer(notes<MemberNotes>().get('lastValidationError')).catch(() => '');
	const isFieldMentioned = error.toLowerCase().includes(fieldName.toLowerCase());
	if (!error || (!isFieldMentioned && !/cannot be empty|required|missing|invalid|must not be empty|too short|too long|already associated/i.test(error))) {
		throw new Error(`Expected a validation error related to "${fieldName}", but got: "${error}"`);
	}
});

Then('no new member should be created in {string}', async (_communityName: string) => {
	const actor = actorCalled(lastActorName);
	const memberId = await actor.answer(notes<MemberNotes>().get('lastMemberId')).catch(() => '');
	const validationError = await actor.answer(notes<MemberNotes>().get('lastValidationError')).catch(() => '');
	if (memberId || !validationError) {
		throw new Error('Expected member creation to be blocked by validation');
	}
});
