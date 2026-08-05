import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import { LogInWithOAuth2 } from '../../../shared/abilities/oauth2-login.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { MemberListedInCommunity } from '../questions/member-listed-in-community.ts';
import { CreateMember } from '../tasks/create-member.ts';
import { ListMembers } from '../tasks/list-members.ts';
import { SearchMemberList } from '../tasks/search-member-list.ts';

interface ListedMemberDetails {
	memberName: string;
	role?: string;
}

Given('{word} is an authenticated community admin for {string}', async (actorName: string, communityName: string) => {
	const owner = actorInTheSpotlight();
	const communityIdsByName = await owner.answer(notes<MemberE2ENotes>().get('communityIdsByName'));
	if (!communityIdsByName[communityName]) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

	await actorCalled(actorName).attemptsTo(notes<MemberE2ENotes>().set('communityIdsByName', communityIdsByName), LogInWithOAuth2(actors.CommunityOwner.email));
});

Given('the following members exist in {string}:', async (communityName: string, dataTable: DataTable) => {
	const actor = actorInTheSpotlight();
	for (const { memberName } of dataTable.hashes() as ListedMemberDetails[]) {
		await actor.attemptsTo(CreateMember(communityName, memberName.trim()));
	}
});

When('{word} lists members for {string}', async (actorName: string, communityName: string) => {
	await actorCalled(actorName).attemptsTo(ListMembers(communityName));
});

When('{word} searches the member list in {string} for {string}', async (actorName: string, communityName: string, searchTerm: string) => {
	await actorCalled(actorName).attemptsTo(ListMembers(communityName), SearchMemberList(searchTerm));
});

Then('{word} should see the following members in {string}:', async (actorName: string, _communityName: string, dataTable: DataTable) => {
	const actor = actorCalled(actorName);
	for (const { memberName } of dataTable.hashes() as ListedMemberDetails[]) {
		if (!(await actor.answer(MemberListedInCommunity(memberName)))) {
			throw new Error(`Expected member "${memberName}" to appear in the browser member list`);
		}
	}
});

Then('{word} should not see member {string} from {string}', async (actorName: string, memberName: string, _communityName: string) => {
	if (await actorCalled(actorName).answer(MemberListedInCommunity(memberName))) {
		throw new Error(`Expected member "${memberName}" not to appear in the browser member list`);
	}
});

Then('{word} should not see member {string} in the filtered results', async (actorName: string, memberName: string) => {
	if (await actorCalled(actorName).answer(MemberListedInCommunity(memberName))) {
		throw new Error(`Expected member "${memberName}" not to appear in the filtered member list`);
	}
});
