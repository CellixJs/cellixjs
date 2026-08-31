import { type Actor, notes, Question } from '@serenity-js/core';
import { communityPortalPageOf, openMemberProfileEditorFor } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes, MemberProfileExpectation } from '../notes/member-notes.ts';
import { CommunityId } from './community-id.ts';

const assertProfileValue = (name: string, actual: string | boolean, expected: string | boolean) => {
	if (actual !== expected) {
		throw new Error(`Expected member profile ${name} to be "${expected}", got "${actual}"`);
	}
};

export const MemberProfileMatches = (communityName: string) =>
	Question.about(`whether the member profile matches the expected values in "${communityName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const profile = await actor.answer(notes<MemberE2ENotes>().get('lastExpectedMemberProfile'));
		const memberId = await actor.answer(notes<MemberE2ENotes>().get('lastMemberId'));
		const routeMemberId = await actor.answer(notes<MemberE2ENotes>().get('routeMemberId'));
		if (!profile || !memberId || !routeMemberId) {
			throw new Error(`Missing profile, member, or route member state for "${communityName}"`);
		}

		const communityId = await actor.answer(CommunityId(communityName));
		const page = await openMemberProfileEditorFor(communityPortalPageOf(actor), communityId, routeMemberId, memberId);
		await verifyProfile(page, profile);
		return true;
	});

const verifyProfile = async (page: Awaited<ReturnType<typeof openMemberProfileEditorFor>>, profile: MemberProfileExpectation) => {
	if (profile.name !== undefined) assertProfileValue('name', await page.displayNameValue(), profile.name);
	if (profile.email !== undefined) assertProfileValue('email', await page.emailValue(), profile.email);
	if (profile.bio !== undefined) assertProfileValue('bio', await page.bioValue(), profile.bio);
	if (profile.showInterests !== undefined) assertProfileValue('showInterests', await page.showInterestsValue(), profile.showInterests);
	if (profile.showEmail !== undefined) assertProfileValue('showEmail', await page.showEmailValue(), profile.showEmail);
	if (profile.showProfile !== undefined) assertProfileValue('showProfile', await page.showProfileValue(), profile.showProfile);
	if (profile.showLocation !== undefined) assertProfileValue('showLocation', await page.showLocationValue(), profile.showLocation);
	if (profile.showProperties !== undefined) assertProfileValue('showProperties', await page.showPropertiesValue(), profile.showProperties);
};
