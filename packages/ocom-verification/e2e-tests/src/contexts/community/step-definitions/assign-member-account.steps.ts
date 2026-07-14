import { Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { MemberAccountLinked } from '../questions/member-account-linked.ts';
import { AssignMemberAccount } from '../tasks/assign-member-account.ts';

const accountDetails: Record<string, { displayName: string; email: string; externalId: string }> = {
	Charlie: {
		displayName: `${actors.CommunityOwner.givenName} ${actors.CommunityOwner.familyName}`,
		email: actors.CommunityOwner.email,
		externalId: actors.CommunityOwner.externalId,
	},
};

Given('end-user account {string} is available for assignment in {string}', async (accountLabel: string, _communityName: string) => {
	const actor = actorInTheSpotlight();
	const account = accountDetails[accountLabel];
	if (!account) {
		throw new Error(`Unknown end-user account label "${accountLabel}"`);
	}
	await actor.attemptsTo(
		notes<MemberE2ENotes>().set('endUserDisplayNamesByLabel', { [accountLabel]: account.displayName }),
		notes<MemberE2ENotes>().set('endUserEmailsByLabel', { [accountLabel]: account.email }),
		notes<MemberE2ENotes>().set('endUserExternalIdsByLabel', { [accountLabel]: account.externalId }),
		notes<MemberE2ENotes>().set('memberAccountLinked', false),
	);
});

When('{word} associates end-user account {string} to member {string} in {string}', async (actorName: string, accountLabel: string, _memberName: string, communityName: string) => {
	const actor = actorCalled(actorName);
	const displayNames = await actor.answer(notes<MemberE2ENotes>().get('endUserDisplayNamesByLabel'));
	await actor.attemptsTo(AssignMemberAccount(communityName, displayNames[accountLabel] ?? ''));
});

Then('member {string} should be linked to end-user account {string}', async (_memberName: string, accountLabel: string) => {
	const actor = actorInTheSpotlight();
	const emails = await actor.answer(notes<MemberE2ENotes>().get('endUserEmailsByLabel'));
	if (!(await actor.answer(MemberAccountLinked(emails[accountLabel] ?? '')))) {
		throw new Error(`Expected the member account list to contain end-user account "${accountLabel}"`);
	}
});
