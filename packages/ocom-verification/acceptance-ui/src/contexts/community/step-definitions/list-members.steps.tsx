import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import type { MemberUiNotes } from '../notes/member-notes.ts';
import { MemberListedInCommunity } from '../questions/member-listed-in-community.ts';
import { ListMembers } from '../tasks/list-members.tsx';
import { SearchMemberList } from '../tasks/search-member-list.ts';

interface ListedMemberDetails {
	memberName: string;
	role?: string;
}

Given('{word} is an authenticated community admin for {string}', async (actorName: string, _communityName: string) => {
	const owner = actorInTheSpotlight();
	const membersByCommunityName = await owner.answer(notes<MemberUiNotes>().get('membersByCommunityName')).catch(() => ({}));
	await actorCalled(actorName).attemptsTo(notes<MemberUiNotes>().set('membersByCommunityName', membersByCommunityName));
});

Given('the following members exist in {string}:', async (communityName: string, dataTable: DataTable) => {
	const actor = actorInTheSpotlight();
	const membersByCommunityName = await actor.answer(notes<MemberUiNotes>().get('membersByCommunityName')).catch(() => ({}));
	await actor.attemptsTo(
		notes<MemberUiNotes>().set('membersByCommunityName', {
			...membersByCommunityName,
			[communityName]: (dataTable.hashes() as ListedMemberDetails[]).map(({ memberName }) => memberName.trim()),
		}),
	);
});

When('{word} lists members for {string}', async (actorName: string, communityName: string) => {
	const actor = actorCalled(actorName);
	const membersByCommunityName = await actor.answer(notes<MemberUiNotes>().get('membersByCommunityName'));
	await actor.attemptsTo(ListMembers(membersByCommunityName[communityName] ?? []));
});

When('{word} searches the member list in {string} for {string}', async (actorName: string, communityName: string, searchTerm: string) => {
	const actor = actorCalled(actorName);
	const membersByCommunityName = await actor.answer(notes<MemberUiNotes>().get('membersByCommunityName'));
	await actor.attemptsTo(ListMembers(membersByCommunityName[communityName] ?? []), SearchMemberList(searchTerm));
});

Then('{word} should see the following members in {string}:', async (actorName: string, _communityName: string, dataTable: DataTable) => {
	const actor = actorCalled(actorName);
	for (const { memberName } of dataTable.hashes() as ListedMemberDetails[]) {
		if (!(await actor.answer(MemberListedInCommunity(memberName)))) {
			throw new Error(`Expected member "${memberName}" to appear in the rendered member list`);
		}
	}
});

Then('{word} should not see member {string} from {string}', async (actorName: string, memberName: string, _communityName: string) => {
	if (await actorCalled(actorName).answer(MemberListedInCommunity(memberName))) {
		throw new Error(`Expected member "${memberName}" not to appear in the rendered member list`);
	}
});

Then('{word} should not see member {string} in the filtered results', async (actorName: string, memberName: string) => {
	if (await actorCalled(actorName).answer(MemberListedInCommunity(memberName))) {
		throw new Error(`Expected member "${memberName}" not to appear in the filtered member list`);
	}
});
