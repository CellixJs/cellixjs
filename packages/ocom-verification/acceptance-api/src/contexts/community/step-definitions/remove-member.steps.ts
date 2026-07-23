import { Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import type { MemberNotes } from '../notes/member-notes.ts';
import { CommunityIdNamed } from '../questions/community-id-named.ts';
import { HasNoMemberForCommunity } from '../questions/has-no-member-for-community.ts';
import { MemberListedInCommunity } from '../questions/member-listed-in-community.ts';
import { RemoveMember } from '../tasks/remove-member.ts';

let lastActorName = actors.CommunityOwner.name;
let managementOwnerActorName = actors.CommunityOwner.name;

Given('{word} is signed in without membership in {string}', async (actorName: string, communityName: string) => {
	const owner = actorInTheSpotlight();
	managementOwnerActorName = owner.name;
	const communityId = await owner.answer(CommunityIdNamed.called(communityName));
	const communityIds = await owner.answer(notes<MemberNotes>().get('communityIdsByName'));
	const targetMemberId = await owner.answer(notes<MemberNotes>().get('lastMemberId'));
	const targetMemberName = await owner.answer(notes<MemberNotes>().get('lastMemberName'));

	const actor = actorCalled(actorName);
	const authorizationToken = actors.CommunityMember.email;
	if (!(await actor.answer(HasNoMemberForCommunity.authenticatedWith(authorizationToken, communityId)))) {
		throw new Error(`Expected ${actorName} to have no membership in community "${communityName}"`);
	}
	await actor.attemptsTo(
		notes<MemberNotes>().set('communityIdsByName', communityIds),
		notes<MemberNotes>().set('lastMemberId', targetMemberId),
		notes<MemberNotes>().set('lastMemberName', targetMemberName),
		notes<MemberNotes>().set('lastMemberCommunityId', communityId),
		notes<MemberNotes>().set('principalMemberId', targetMemberId),
		notes<MemberNotes>().set('authorizationToken', authorizationToken),
		notes<MemberNotes>().set('lastAuthorizationError', undefined as unknown as string),
	);
});

When('{word} removes member {string} from {string}', async (actorName: string, _memberName: string, communityName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const memberId = await actor.answer(notes<MemberNotes>().get('lastMemberId'));
	const communityId = await actor.answer(CommunityIdNamed.called(communityName));
	if (!memberId) {
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
	const communityId = await actor.answer(CommunityIdNamed.called(communityName));
	if (await actor.answer(MemberListedInCommunity.named(memberName, communityId))) {
		throw new Error(`Expected member "${memberName}" not to appear in listings for "${communityName}"`);
	}
});

When('{word} attempts to remove member {string} from {string}', async (actorName: string, _memberName: string, communityName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const memberId = await actor.answer(notes<MemberNotes>().get('lastMemberId'));
	const communityId = await actor.answer(CommunityIdNamed.called(communityName));
	try {
		await actor.attemptsTo(RemoveMember.withId(memberId, communityId));
	} catch (error) {
		await actor.attemptsTo(notes<MemberNotes>().set('lastAuthorizationError', error instanceof Error ? error.message : String(error)));
	}
});

Then('{word} should receive an authorization error for member management', async (actorName: string) => {
	const error = await actorCalled(actorName)
		.answer(notes<MemberNotes>().get('lastAuthorizationError'))
		.catch(() => '');
	if (!/permission|cannot remove|unauthorized|forbidden|not a member/i.test(error)) {
		throw new Error(`Expected a member-management authorization error, but got: "${error}"`);
	}
});

Then('member {string} should remain in {string}', async (memberName: string, communityName: string) => {
	const owner = actorCalled(managementOwnerActorName);
	const communityId = await owner.answer(CommunityIdNamed.called(communityName));
	if (!(await owner.answer(MemberListedInCommunity.named(memberName, communityId)))) {
		throw new Error(`Expected member "${memberName}" to remain in "${communityName}"`);
	}
});
