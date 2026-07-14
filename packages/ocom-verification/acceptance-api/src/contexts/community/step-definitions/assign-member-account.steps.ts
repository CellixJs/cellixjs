import { Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import type { MemberNotes } from '../notes/member-notes.ts';
import { EndUserIdInCommunity } from '../questions/end-user-id-in-community.ts';
import { MemberAccountCount, MemberAccountLinked } from '../questions/member-account-linked.ts';
import { AssignMemberAccount } from '../tasks/assign-member-account.ts';

const accountDisplayNames: Record<string, string> = {
	Charlie: `${actors.CommunityOwner.givenName} ${actors.CommunityOwner.familyName}`,
};

Given('end-user account {string} is available for assignment in {string}', async (accountLabel: string, communityName: string) => {
	const actor = actorInTheSpotlight();
	const communityIds = await actor.answer(notes<MemberNotes>().get('communityIdsByName'));
	const communityId = communityIds[communityName];
	const displayName = accountDisplayNames[accountLabel];
	if (!communityId || !displayName) {
		throw new Error(`Unknown community or end-user account label: "${communityName}" / "${accountLabel}"`);
	}
	const endUserId = await actor.answer(EndUserIdInCommunity.withDisplayName(communityId, displayName));
	const idsByLabel = await actor.answer(notes<MemberNotes>().get('endUserIdsByLabel')).catch(() => ({}) as Record<string, string>);
	await actor.attemptsTo(notes<MemberNotes>().set('endUserIdsByLabel', { ...idsByLabel, [accountLabel]: endUserId }));
});

When('{word} associates end-user account {string} to member {string} in {string}', async (actorName: string, accountLabel: string, _memberName: string, communityName: string) => {
	const actor = actorCalled(actorName);
	const communityIds = await actor.answer(notes<MemberNotes>().get('communityIdsByName'));
	const endUserIds = await actor.answer(notes<MemberNotes>().get('endUserIdsByLabel'));
	const memberId = await actor.answer(notes<MemberNotes>().get('lastMemberId'));
	await actor.attemptsTo(notes<MemberNotes>().set('lastValidationError', undefined as unknown as string));
	try {
		await actor.attemptsTo(AssignMemberAccount.to({ communityId: communityIds[communityName] ?? '', memberId, endUserId: endUserIds[accountLabel] ?? '' }));
	} catch (error) {
		await actor.attemptsTo(notes<MemberNotes>().set('lastValidationError', error instanceof Error ? error.message : String(error)));
	}
});

Given('member {string} is already linked to end-user account {string}', async (_memberName: string, accountLabel: string) => {
	const actor = actorInTheSpotlight();
	const communityId = await actor.answer(notes<MemberNotes>().get('lastMemberCommunityId'));
	const memberId = await actor.answer(notes<MemberNotes>().get('lastMemberId'));
	const endUserIds = await actor.answer(notes<MemberNotes>().get('endUserIdsByLabel'));
	await actor.attemptsTo(AssignMemberAccount.to({ communityId, memberId, endUserId: endUserIds[accountLabel] ?? '' }));
});

Then('member {string} should be linked to end-user account {string}', async (_memberName: string, accountLabel: string) => {
	const actor = actorInTheSpotlight();
	const memberId = await actor.answer(notes<MemberNotes>().get('lastMemberId'));
	const endUserIds = await actor.answer(notes<MemberNotes>().get('endUserIdsByLabel'));
	if (!(await actor.answer(MemberAccountLinked.for(memberId, endUserIds[accountLabel] ?? '')))) {
		throw new Error(`Expected member "${memberId}" to be linked to end-user account "${accountLabel}"`);
	}
});

Then('member {string} should remain linked to end-user account {string} only once', async (_memberName: string, accountLabel: string) => {
	const actor = actorInTheSpotlight();
	const memberId = await actor.answer(notes<MemberNotes>().get('lastMemberId'));
	const endUserIds = await actor.answer(notes<MemberNotes>().get('endUserIdsByLabel'));
	const count = await actor.answer(MemberAccountCount.for(memberId, endUserIds[accountLabel] ?? ''));
	if (count !== 1) {
		throw new Error(`Expected one account association for "${accountLabel}" but found ${count}`);
	}
});
