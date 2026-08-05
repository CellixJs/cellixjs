import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { communityPortalPageOf, memberProfilePageOn } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes, MemberProfileExpectation } from '../notes/member-notes.ts';

export const FillMemberProfileForm = (actor: Actor, profile: MemberProfileExpectation) =>
	Interaction.where(the`#actor fills the member profile form`, async () => {
		const memberProfilePage = memberProfilePageOn(communityPortalPageOf(actor));
		if (profile.name !== undefined) await memberProfilePage.fillDisplayName(profile.name);
		if (profile.email !== undefined) await memberProfilePage.fillEmail(profile.email);
		if (profile.bio !== undefined) await memberProfilePage.fillBio(profile.bio);
		if (profile.showInterests !== undefined) await memberProfilePage.setShowInterests(profile.showInterests);
		if (profile.showEmail !== undefined) await memberProfilePage.setShowEmail(profile.showEmail);
		if (profile.showProfile !== undefined) await memberProfilePage.setShowProfile(profile.showProfile);
		if (profile.showLocation !== undefined) await memberProfilePage.setShowLocation(profile.showLocation);
		if (profile.showProperties !== undefined) await memberProfilePage.setShowProperties(profile.showProperties);
		await actor.attemptsTo(notes<MemberE2ENotes>().set('lastExpectedMemberProfile', profile));
	});
