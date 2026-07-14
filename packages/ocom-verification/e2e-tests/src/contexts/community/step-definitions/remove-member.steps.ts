import { Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { MemberListedInCommunity } from '../questions/member-listed-in-community.ts';
import { MemberRemovedFlag } from '../questions/member-removed-flag.ts';
import { RemoveMember } from '../tasks/remove-member.ts';

let lastActorName = actors.CommunityOwner.name;

When('{word} removes member {string} from {string}', async (actorName: string, memberName: string, communityName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<MemberE2ENotes>().set('memberRemoved', false), RemoveMember(communityName, memberName));
});

Then('the member should be removed successfully from {string}', async (_communityName: string) => {
	if (!(await actorCalled(lastActorName).answer(MemberRemovedFlag()))) {
		throw new Error('Expected member removal to succeed');
	}
});

Then('member {string} should not appear in member listings for {string}', async (memberName: string, _communityName: string) => {
	if (await actorCalled(lastActorName).answer(MemberListedInCommunity(memberName))) {
		throw new Error(`Expected member "${memberName}" not to appear in the browser member list`);
	}
});
