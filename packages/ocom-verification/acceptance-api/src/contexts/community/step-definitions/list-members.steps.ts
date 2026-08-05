import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import type { MemberNotes } from '../notes/member-notes.ts';
import { CommunityIdNamed } from '../questions/community-id-named.ts';
import { MemberVisibleInList } from '../questions/member-visible-in-list.ts';
import { PrincipalMemberIdForCommunity } from '../questions/principal-member-id-for-community.ts';
import { CreateMember } from '../tasks/create-member.ts';
import { ListMembers } from '../tasks/list-members.ts';

Given('{word} is an authenticated community admin for {string}', async (actorName: string, communityName: string) => {
	const owner = actorInTheSpotlight();
	await owner.answer(CommunityIdNamed.called(communityName));
	const communityIdsByName = await owner.answer(notes<MemberNotes>().get('communityIdsByName'));

	await actorCalled(actorName).attemptsTo(notes<MemberNotes>().set('communityIdsByName', communityIdsByName));
});

Given('the following members exist in {string}:', async (communityName: string, dataTable: DataTable) => {
	const actor = actorInTheSpotlight();
	const communityId = await actor.answer(CommunityIdNamed.called(communityName));

	for (const details of dataTable.hashes()) {
		const { memberName } = details;
		if (!memberName) {
			throw new Error('memberName is required when creating listed members');
		}
		const principalMemberId = await actor.answer(PrincipalMemberIdForCommunity.inCommunity(communityId));
		await actor.attemptsTo(CreateMember({ memberName: memberName.trim(), communityId, principalMemberId }));
	}
});

When('{word} lists members for {string}', async (actorName: string, communityName: string) => {
	const actor = actorCalled(actorName);
	const communityId = await actor.answer(CommunityIdNamed.called(communityName));

	await actor.attemptsTo(ListMembers.inCommunity(communityId));
});

When('{word} searches the member list in {string} for {string}', async (actorName: string, communityName: string, searchTerm: string) => {
	const actor = actorCalled(actorName);
	const communityId = await actor.answer(CommunityIdNamed.called(communityName));

	await actor.attemptsTo(ListMembers.inCommunity(communityId, searchTerm));
});

Then('{word} should see the following members in {string}:', async (actorName: string, _communityName: string, dataTable: DataTable) => {
	const actor = actorCalled(actorName);
	for (const details of dataTable.hashes()) {
		const { memberName } = details;
		if (!memberName) {
			throw new Error('memberName is required when verifying listed members');
		}
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
