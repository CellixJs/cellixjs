import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import { SwitchOAuth2User } from '../../../shared/abilities/oauth2-login.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { HasNoMemberForCommunity } from '../questions/has-no-member-for-community.ts';
import { MemberListedInCommunity } from '../questions/member-listed-in-community.ts';
import { MemberRemovedFlag } from '../questions/member-removed-flag.ts';
import { RemoveMember } from '../tasks/remove-member.ts';

let lastActorName = actors.CommunityOwner.name;
let managementOwnerActorName = actors.CommunityOwner.name;
let managementOwnerMemberId = '';

Given('{word} is signed in without membership in {string}', async (actorName: string, communityName: string) => {
	const owner = actorInTheSpotlight();
	managementOwnerActorName = owner.name;
	const communityIds = await owner.answer(notes<MemberE2ENotes>().get('communityIdsByName'));
	const targetMemberId = await owner.answer(notes<MemberE2ENotes>().get('lastMemberId'));
	const { page } = BrowseTheWeb.withActor(owner);
	managementOwnerMemberId = new URL(page.url()).pathname.match(/\/admin\/([^/]+)\/members\//)?.[1] ?? '';
	const actor = actorCalled(actorName);
	await actor.attemptsTo(
		notes<MemberE2ENotes>().set('communityIdsByName', communityIds),
		notes<MemberE2ENotes>().set('lastMemberId', targetMemberId),
		notes<MemberE2ENotes>().set('principalMemberId', targetMemberId),
		notes<MemberE2ENotes>().set('memberRemoved', false),
		notes<MemberE2ENotes>().set('errorMessage', null),
		SwitchOAuth2User('test@example.com'),
	);
	if (!communityIds[communityName] || !managementOwnerMemberId) {
		throw new Error(`Missing owner state for authorization scenario in "${communityName}"`);
	}
	if (!(await actor.answer(HasNoMemberForCommunity.inCommunity(communityIds[communityName])))) {
		throw new Error(`Expected ${actorName} to have no membership in community "${communityName}"`);
	}
});

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

When('{word} attempts to remove member {string} from {string}', async (actorName: string, memberName: string, communityName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	try {
		await actor.attemptsTo(RemoveMember(communityName, memberName));
	} catch (error) {
		await actor.attemptsTo(notes<MemberE2ENotes>().set('errorMessage', error instanceof Error ? error.message : String(error)), notes<MemberE2ENotes>().set('memberRemoved', false));
	}
});

Then('{word} should receive an authorization error for member management', async (actorName: string) => {
	const error = await actorCalled(actorName).answer(notes<MemberE2ENotes>().get('errorMessage'));
	if (!error || !/permission|cannot remove|unauthorized|forbidden|not authorized|not a member/i.test(error)) {
		throw new Error(`Expected a member-management authorization error, but got: "${error}"`);
	}
});

Then('member {string} should remain in {string}', async (memberName: string, communityName: string) => {
	const owner = actorCalled(managementOwnerActorName);
	const communityIds = await owner.answer(notes<MemberE2ENotes>().get('communityIdsByName'));
	await owner.attemptsTo(SwitchOAuth2User(actors.CommunityOwner.email));
	if (!(await owner.answer(MemberListedInCommunity(memberName, { communityId: communityIds[communityName] ?? '', principalMemberId: managementOwnerMemberId })))) {
		throw new Error(`Expected member "${memberName}" to remain in "${communityName}"`);
	}
});
