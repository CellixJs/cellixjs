import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { Render } from '@cellix/serenity-framework/dom/render-in-dom';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import React from 'react';
import { MembersCreate } from '../../../../../../ocom/ui-community-route-admin/src/components/members-create.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import type { MemberUiNotes } from '../notes/member-notes.ts';
import { MemberBelongsToCommunity } from '../questions/member-belongs-to-community.ts';
import { MemberCreatedFlag } from '../questions/member-created-flag.ts';
import { CreateMember } from '../tasks/create-member.ts';

const reactGlobal = globalThis as typeof globalThis & { React?: typeof React };
reactGlobal.React ??= React;

interface MemberDetails {
	memberName?: string;
}

let lastActorName = 'Alice';

const toCommunityId = (communityName: string): string =>
	communityName
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

Given('{word} is signed in as a community owner for member management', async (actorName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);

	await actor.attemptsTo(
		notes<MemberUiNotes>().set('communityIdsByName', {}),
		notes<MemberUiNotes>().set('endUserExternalIdsByLabel', {}),
		notes<MemberUiNotes>().set('memberCreated', false),
		notes<MemberUiNotes>().set('lastMemberName', ''),
		notes<MemberUiNotes>().set('lastMemberCommunityName', ''),
	);
});

Given('{word} has a community named {string}', async (actorName: string, communityName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);

	const existing = (await actor.answer(notes<MemberUiNotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>)) as Record<string, string>;

	await actor.attemptsTo(
		notes<MemberUiNotes>().set('communityIdsByName', {
			...existing,
			[communityName]: toCommunityId(communityName),
		}),
	);
});

Given('{word} is an existing end-user account', async (accountLabel: string) => {
	const actor = actorCalled(lastActorName);
	const existing = (await actor.answer(notes<MemberUiNotes>().get('endUserExternalIdsByLabel')).catch(() => ({}) as Record<string, string>)) as Record<string, string>;

	await actor.attemptsTo(
		notes<MemberUiNotes>().set('endUserExternalIdsByLabel', {
			...existing,
			[accountLabel]: `end-user-${accountLabel.trim().toLowerCase()}`,
		}),
	);
});

When('{word} creates a member in {string} with:', async (actorName: string, communityName: string, dataTable: DataTable) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<MemberDetails>();
	const memberName = details.memberName?.trim() ?? '';

	if (!memberName) {
		throw new Error('memberName is required');
	}

	const communityIdsByName = (await actor.answer(notes<MemberUiNotes>().get('communityIdsByName')).catch(() => ({}) as Record<string, string>)) as Record<string, string>;

	if (!communityIdsByName[communityName]) {
		throw new Error(`Unknown community "${communityName}". Ensure it was created in setup.`);
	}

	const onSave = async (values: { memberName?: string }): Promise<void> => {
		await actor.attemptsTo(notes<MemberUiNotes>().set('memberCreated', true), notes<MemberUiNotes>().set('lastMemberName', values.memberName?.trim() ?? ''), notes<MemberUiNotes>().set('lastMemberCommunityName', communityName));
	};

	await actor.attemptsTo(
		notes<MemberUiNotes>().set('memberCreated', false),
		notes<MemberUiNotes>().set('lastMemberName', ''),
		notes<MemberUiNotes>().set('lastMemberCommunityName', ''),
		Render.component(<MembersCreate onSave={onSave} />, { wrapper: wrapOcomComponent() }),
		CreateMember(memberName),
	);
});

Then('the member should be created successfully in {string}', async (communityName: string) => {
	const actor = actorInTheSpotlight();
	const submitted = await actor.answer(MemberCreatedFlag());
	const actualCommunityName = await actor.answer(notes<MemberUiNotes>().get('lastMemberCommunityName'));

	if (!submitted) {
		throw new Error(`Expected member creation to succeed for "${communityName}"`);
	}

	if (actualCommunityName !== communityName) {
		throw new Error(`Expected member to be created in "${communityName}" but got "${actualCommunityName}"`);
	}
});

Then('the member {string} should belong to {string}', async (memberName: string, communityName: string) => {
	const actor = actorInTheSpotlight();
	const belongs = await actor.answer(MemberBelongsToCommunity(memberName, communityName));

	if (!belongs) {
		throw new Error(`Expected member "${memberName}" to belong to "${communityName}"`);
	}
});
