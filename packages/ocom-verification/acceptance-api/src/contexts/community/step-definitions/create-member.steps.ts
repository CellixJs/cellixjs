import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { Ensure, equals, isPresent } from '@serenity-js/assertions';
import { actorCalled, notes } from '@serenity-js/core';
import { LastGraphQLResponse } from '../../../shared/questions/last-graphql-response.ts';
import type { MemberNotes } from '../notes/member-notes.ts';
import { CommunityIdNamed } from '../questions/community-id-named.ts';
import { MemberById } from '../questions/member-by-id.ts';
import { PrincipalMemberIdForCommunity } from '../questions/principal-member-id-for-community.ts';
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

	const communityId = await actor.answer(CommunityIdNamed.called(communityName));

	const principalMemberId = await actor.answer(PrincipalMemberIdForCommunity.inCommunity(communityId));
	await actor.attemptsTo(CreateMember({ memberName, communityId, principalMemberId }));
});

When('{word} attempts to create a member in {string} with:', async (actorName: string, communityName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<MemberDetails>();
	const communityId = await actor.answer(CommunityIdNamed.called(communityName));

	await actor.attemptsTo(notes<MemberNotes>().set('lastMemberId', undefined as unknown as string), notes<MemberNotes>().set('lastValidationError', undefined as unknown as string));

	try {
		const principalMemberId = await actor.answer(PrincipalMemberIdForCommunity.inCommunity(communityId));
		await actor.attemptsTo(CreateMember({ memberName: details.memberName?.trim() ?? '', communityId, principalMemberId }));
	} catch (error) {
		await actor.attemptsTo(notes<MemberNotes>().set('lastValidationError', error instanceof Error ? error.message : String(error)));
	}
});

Then('the member should be created successfully in {string}', async (communityName: string) => {
	const actor = actorCalled(lastActorName);
	await actor.attemptsTo(Ensure.that(LastGraphQLResponse.field<boolean>('memberCreate.status.success'), equals(true)), Ensure.that(LastGraphQLResponse.field<string>('memberCreate.member.id'), isPresent()));

	const memberId = await actor.answer(LastGraphQLResponse.field<string>('memberCreate.member.id'));
	const memberName = await actor.answer(notes<MemberNotes>().get('lastMemberName'));
	const communityId = await actor.answer(CommunityIdNamed.called(communityName));
	const persistedMember = await actor.answer(MemberById.withId(memberId));

	await actor.attemptsTo(
		Ensure.that(persistedMember, isPresent()),
		Ensure.that(persistedMember?.id, equals(memberId)),
		Ensure.that(persistedMember?.memberName, equals(memberName)),
		Ensure.that(persistedMember?.community?.id, equals(communityId)),
	);
});

Then('she should see a member error for {string}', async (fieldName: string) => {
	const actor = actorCalled(lastActorName);
	const responseError = await actor.answer(LastGraphQLResponse.field<string>('memberCreate.status.errorMessage')).catch(() => '');
	const capturedError = await actor.answer(notes<MemberNotes>().get('lastValidationError')).catch(() => '');
	const error = responseError || capturedError;
	const isFieldMentioned = error.toLowerCase().includes(fieldName.toLowerCase());
	if (!error || (!isFieldMentioned && !/cannot be empty|required|missing|invalid|must not be empty|too short|too long|already associated/i.test(error))) {
		throw new Error(`Expected a validation error related to "${fieldName}", but got: "${error}"`);
	}
});

Then('no new member should be created in {string}', async (_communityName: string) => {
	const actor = actorCalled(lastActorName);
	const memberId = await actor.answer(notes<MemberNotes>().get('lastMemberId')).catch(() => '');
	const success = await actor.answer(LastGraphQLResponse.field<boolean>('memberCreate.status.success')).catch(() => undefined);
	const capturedError = await actor.answer(notes<MemberNotes>().get('lastValidationError')).catch(() => '');
	if (memberId || success === true || (success === undefined && !capturedError)) {
		throw new Error('Expected member creation to be blocked by validation');
	}
});
