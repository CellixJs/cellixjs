import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import type { MemberNotes } from '../notes/member-notes.ts';
import { MemberBelongsToCommunity } from '../questions/member-belongs-to-community.ts';
import { CreateCommunity } from '../tasks/create-community.ts';
import { CreateMember } from '../tasks/create-member.ts';

let lastActorName = actors.CommunityOwner.name;

interface MemberDetails {
	memberName: string;
	role?: string;
	email?: string;
}

const seededEndUserLabelMap: Record<string, keyof typeof actors> = {
	Charlie: 'CommunityMember',
};

Given('{word} is signed in as a community owner for member management', (actorName: string) => {
	lastActorName = actorName;
	actorCalled(actorName);
});

Given('{word} has a community named {string}', async (actorName: string, communityName: string) => {
	lastActorName = actorName;

	const actor = actorCalled(actorName);
	await actor.attemptsTo(CreateCommunity.withName(communityName));

	// CreateCommunity task sets lastCommunityId; copy into communityIdsByName
	const communityId = (await actor.answer(notes().get('lastCommunityId'))) as string;
	const existing = await actor.answer(notes<MemberNotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>);

	await actor.attemptsTo(
		notes<MemberNotes>().set('communityIdsByName', {
			...existing,
			[communityName]: communityId,
		}),
	);

	// make actor a member of the community with a role that has canManageMembers permission
});

Given('{word} is an existing end-user account', async (label: string) => {
	const actorKey = seededEndUserLabelMap[label];
	if (!actorKey) {
		throw new Error(`No seeded end-user mapping for label "${label}"`);
	}

	const seeded = actors[actorKey];
	await actorCalled(lastActorName).attemptsTo(notes().set(`endUser.externalId.${label}`, seeded.externalId), notes().set(`endUser.email.${label}`, seeded.email));
});

When('{word} creates a member in {string} with:', async (actorName: string, communityName: string, dataTable: DataTable) => {
	lastActorName = actorName;

	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<MemberDetails>();

	const memberName = details.memberName?.trim() ?? '';
	if (!memberName) {
		throw new Error('memberName is required');
	}

	// Resolve the community id by name from notes populated in the Given step
	const communityIdsByName = await actor.answer(notes<MemberNotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>);

	const communityId = communityIdsByName[communityName];
	if (!communityId) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

	await actor.attemptsTo(notes<MemberNotes>().set('lastValidationError', undefined as unknown as string));
	await actor.attemptsTo(
		CreateMember.with({
			memberName,
			communityId,
			...(details.role ? { role: details.role } : {}),
		}),
	);

	await actor.attemptsTo(notes<MemberNotes>().set('lastMemberCommunityId', communityId));
});

Then('the member should be created successfully in {string}', async (communityName: string) => {
	const actor = actorCalled(lastActorName);

	const status = await actor.answer(notes<MemberNotes>().get('lastMemberStatus'));
	const memberId = await actor.answer(notes<MemberNotes>().get('lastMemberId'));
	const validationError = await actor.answer(notes<MemberNotes>().get('lastValidationError'));
	const communityIdsByName = await actor.answer(notes<MemberNotes>().get('communityIdsByName'));

	if (!communityIdsByName[communityName]) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

	if (validationError) {
		throw new Error(`Expected member creation to succeed for "${communityName}", but got validation error: "${validationError}"`);
	}

	if (status !== 'SUCCESS') {
		throw new Error(`Expected member status "SUCCESS" but got "${status}"`);
	}

	if (!memberId) {
		throw new Error(`Expected a created member id for "${communityName}" but none was recorded`);
	}
});

Then('the member {string} should belong to {string}', async (expectedMemberName: string, communityName: string) => {
	const actor = actorCalled(lastActorName);

	const communityIdsByName = await actor.answer(notes<MemberNotes>().get('communityIdsByName'));
	const expectedCommunityId = communityIdsByName[communityName];
	if (!expectedCommunityId) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

	const lastMemberId = await actor.answer(notes<MemberNotes>().get('lastMemberId'));

	if (!lastMemberId) {
		throw new Error('Expected a created member id but none was recorded');
	}

	const belongs = await actor.answer(MemberBelongsToCommunity.inCommunity(expectedMemberName, expectedCommunityId));
	if (!belongs) {
		throw new Error(`Expected member "${expectedMemberName}" to belong to "${communityName}"`);
	}
});
