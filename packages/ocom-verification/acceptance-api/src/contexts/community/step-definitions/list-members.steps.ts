import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import type { MemberNotes } from '../notes/member-notes.ts';
import { MemberVisibleInList } from '../questions/member-visible-in-list.ts';
import { CreateMember } from '../tasks/create-member.ts';
import { ListMembers } from '../tasks/list-members.ts';

interface ListedMemberDetails {
	memberName: string;
	role?: string;
}

Given('{word} is an authenticated community admin for {string}', async (actorName: string, communityName: string) => {
	const owner = actorInTheSpotlight();
	const communityIdsByName = await owner.answer(notes<MemberNotes>().get('communityIdsByName'));
	if (!communityIdsByName[communityName]) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

	await actorCalled(actorName).attemptsTo(notes<MemberNotes>().set('communityIdsByName', communityIdsByName));
});

Given('the following members exist in {string}:', async (communityName: string, dataTable: DataTable) => {
	const actor = actorInTheSpotlight();
	const communityIdsByName = await actor.answer(notes<MemberNotes>().get('communityIdsByName'));
	const communityId = communityIdsByName[communityName];
	if (!communityId) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

	for (const details of dataTable.hashes() as ListedMemberDetails[]) {
		await actor.attemptsTo(CreateMember.with({ memberName: details.memberName.trim(), communityId, ...(details.role ? { role: details.role } : {}) }));
	}
});

When('{word} lists members for {string}', async (actorName: string, communityName: string) => {
	const actor = actorCalled(actorName);
	const communityIdsByName = await actor.answer(notes<MemberNotes>().get('communityIdsByName'));
	const communityId = communityIdsByName[communityName];
	if (!communityId) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

	await actor.attemptsTo(ListMembers.inCommunity(communityId));
});

When('{word} searches the member list in {string} for {string}', async (actorName: string, communityName: string, searchTerm: string) => {
	const actor = actorCalled(actorName);
	const communityIdsByName = await actor.answer(notes<MemberNotes>().get('communityIdsByName'));
	const communityId = communityIdsByName[communityName];
	if (!communityId) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

	await actor.attemptsTo(ListMembers.inCommunity(communityId, searchTerm));
});

Then('{word} should see the following members in {string}:', async (actorName: string, _communityName: string, dataTable: DataTable) => {
	const actor = actorCalled(actorName);
	for (const { memberName } of dataTable.hashes() as ListedMemberDetails[]) {
		if (!(await actor.answer(MemberVisibleInList.named(memberName)))) {
			throw new Error(`Expected member "${memberName}" to appear in the member list`);
		}
	}
});

Then('{word} should not see member {string} from {string}', async (actorName: string, memberName: string, _communityName: string) => {
	if (await actorCalled(actorName).answer(MemberVisibleInList.named(memberName))) {
		throw new Error(`Expected member "${memberName}" not to appear in the member list`);
	}
});

Then('{word} should not see member {string} in the filtered results', async (actorName: string, memberName: string) => {
	if (await actorCalled(actorName).answer(MemberVisibleInList.named(memberName))) {
		throw new Error(`Expected member "${memberName}" not to appear in the filtered member list`);
	}
});
