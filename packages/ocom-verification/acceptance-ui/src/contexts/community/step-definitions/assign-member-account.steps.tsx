import { Render } from '@cellix/serenity-framework/dom/render-in-dom';
import { Given, Then, When } from '@cucumber/cucumber';
import { actors, END_USER_IDS } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import React from 'react';
import { MembersAccountsAdd } from '../../../../../../ocom/ui-community-route-admin/src/components/members-accounts-add.tsx';
import type { AdminMembersAccountsAddContainerEndUserFieldsFragment, MemberCreateAccountInput } from '../../../../../../ocom/ui-community-route-admin/src/generated.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import type { MemberUiNotes } from '../notes/member-notes.ts';
import { MemberAccountCount, MemberAccountLinked } from '../questions/member-account-linked.ts';
import { AssignMemberAccount } from '../tasks/assign-member-account.ts';

const reactGlobal = globalThis as typeof globalThis & { React?: typeof React };
reactGlobal.React ??= React;

const accountDetails: Record<string, { id: string; displayName: string; email: string }> = {
	Charlie: {
		id: END_USER_IDS.communityOwner,
		displayName: `${actors.CommunityOwner.givenName} ${actors.CommunityOwner.familyName}`,
		email: actors.CommunityOwner.email,
	},
};

Given('end-user account {string} is available for assignment in {string}', async (accountLabel: string, _communityName: string) => {
	const actor = actorInTheSpotlight();
	const account = accountDetails[accountLabel];
	if (!account) {
		throw new Error(`Unknown end-user account label "${accountLabel}"`);
	}
	const memberId = await actor.answer(notes<MemberUiNotes>().get('lastMemberId'));
	const endUser: AdminMembersAccountsAddContainerEndUserFieldsFragment = {
		id: account.id,
		displayName: account.displayName,
		personalInformation: { contactInformation: { email: account.email } },
	};
	const onSave = async (values: MemberCreateAccountInput): Promise<void> => {
		const accountCount = await actor.answer(notes<MemberUiNotes>().get('memberAccountCount')).catch(() => 0);
		if (accountCount > 0) {
			await actor.attemptsTo(notes<MemberUiNotes>().set('memberValidationError', 'Selected user is already associated with this member'));
			return;
		}
		await actor.attemptsTo(
			notes<MemberUiNotes>().set('memberAccountLinked', values.memberId === memberId && values.endUserId === account.id),
			notes<MemberUiNotes>().set('lastLinkedEndUserId', String(values.endUserId)),
			notes<MemberUiNotes>().set('memberAccountCount', accountCount + 1),
			notes<MemberUiNotes>().set('memberValidationError', ''),
		);
	};
	await actor.attemptsTo(
		notes<MemberUiNotes>().set('endUserIdsByLabel', { [accountLabel]: account.id }),
		notes<MemberUiNotes>().set('memberAccountLinked', false),
		notes<MemberUiNotes>().set('memberAccountCount', 0),
		notes<MemberUiNotes>().set('lastLinkedEndUserId', ''),
		Render.component(
			<MembersAccountsAdd
				data={{ memberId, endUserId: account.id }}
				onSave={onSave}
				endUsers={[endUser]}
				loading={false}
			/>,
			{ wrapper: wrapOcomComponent() },
		),
	);
});

When('{word} associates end-user account {string} to member {string} in {string}', async (actorName: string, accountLabel: string, _memberName: string, _communityName: string) => {
	const account = accountDetails[accountLabel];
	if (!account) {
		throw new Error(`Unknown end-user account label "${accountLabel}"`);
	}
	await actorCalled(actorName).attemptsTo(notes<MemberUiNotes>().set('memberValidationError', ''), AssignMemberAccount());
});

Given('member {string} is already linked to end-user account {string}', async (_memberName: string, _accountLabel: string) => {
	await actorInTheSpotlight().attemptsTo(AssignMemberAccount());
});

Then('member {string} should be linked to end-user account {string}', async (_memberName: string, accountLabel: string) => {
	const actor = actorInTheSpotlight();
	const endUserIds = await actor.answer(notes<MemberUiNotes>().get('endUserIdsByLabel'));
	if (!(await actor.answer(MemberAccountLinked(endUserIds[accountLabel] ?? '')))) {
		throw new Error(`Expected the member to be linked to end-user account "${accountLabel}"`);
	}
});

Then('member {string} should remain linked to end-user account {string} only once', async (_memberName: string, _accountLabel: string) => {
	const count = await actorInTheSpotlight().answer(MemberAccountCount());
	if (count !== 1) {
		throw new Error(`Expected one member account association but found ${count}`);
	}
});
