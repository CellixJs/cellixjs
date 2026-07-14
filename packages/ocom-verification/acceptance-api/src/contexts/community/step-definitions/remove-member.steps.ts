import { Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, notes } from '@serenity-js/core';
import type { MemberNotes } from '../notes/member-notes.ts';
import { MemberListedInCommunity } from '../questions/member-listed-in-community.ts';
import { RemoveMember } from '../tasks/remove-member.ts';

let lastActorName = actors.CommunityOwner.name;

When('{word} removes member {string} from {string}', async (actorName: string, _memberName: string, communityName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const communityIds = await actor.answer(notes<MemberNotes>().get('communityIdsByName'));
	const memberId = await actor.answer(notes<MemberNotes>().get('lastMemberId'));
	const communityId = communityIds[communityName];
	if (!communityId || !memberId) {
		throw new Error(`Missing member or community state for removal from "${communityName}"`);
	}
	await actor.attemptsTo(notes<MemberNotes>().set('lastMemberRemoved', false), RemoveMember.withId(memberId, communityId));
});

Then('the member should be removed successfully from {string}', async (_communityName: string) => {
	const actor = actorCalled(lastActorName);
	const removed = await actor.answer(notes<MemberNotes>().get('lastMemberRemoved'));
	if (!removed) {
		throw new Error('Expected member removal to succeed');
	}
});

Then('member {string} should not appear in member listings for {string}', async (memberName: string, communityName: string) => {
	const actor = actorCalled(lastActorName);
	const communityIds = await actor.answer(notes<MemberNotes>().get('communityIdsByName'));
	const communityId = communityIds[communityName];
	if (!communityId) {
		throw new Error(`Unknown community "${communityName}"`);
	}
	if (await actor.answer(MemberListedInCommunity.named(memberName, communityId))) {
		throw new Error(`Expected member "${memberName}" not to appear in listings for "${communityName}"`);
	}
});
