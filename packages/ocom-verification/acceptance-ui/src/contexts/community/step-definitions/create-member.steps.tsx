import { GherkinDataTable } from '@cellix/serenity-framework/cucumber/gherkin-data-table';
import { Render, RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import { MemberCreatePage } from '@ocom-verification/verification-shared/pages';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import React from 'react';
import { MembersCreate } from '../../../../../../ocom/ui-community-route-admin/src/components/members-create.tsx';
import { MemberProfile } from '../../../../../../ocom/ui-community-shared/src/components/member-profile.tsx';
import type { SharedMemberProfileContainerMemberFieldsFragment } from '../../../../../../ocom/ui-community-shared/src/generated.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import type { AcceptanceUiMemberCreatePage } from '../../../shared/page-contracts.ts';
import type { MemberProfileFormValues, MemberUiNotes } from '../notes/member-notes.ts';
import { MemberCreatedFlag } from '../questions/member-created-flag.ts';
import { CreateMember } from '../tasks/create-member.ts';

const reactGlobal = globalThis as typeof globalThis & { React?: typeof React };
reactGlobal.React ??= React;

interface MemberDetails {
	memberName?: string;
}

Given('{word} is signed in as a community owner for member management', async (actorName: string) => {
	const actor = actorCalled(actorName);

	const onSave = async (): Promise<void> => {
		await actor.attemptsTo(notes<MemberUiNotes>().set('memberCreated', true));
	};

	await actor.attemptsTo(notes<MemberUiNotes>().set('memberCreated', false), Render.component(<MembersCreate onSave={onSave} />, { wrapper: wrapOcomComponent() }));
});

Given('{word} has a community named {string}', (_actorName: string, _communityName: string) => undefined);

When('{word} creates a member in {string} with:', async (actorName: string, _communityName: string, dataTable: DataTable) => {
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<MemberDetails>();
	const memberName = details.memberName?.trim() ?? '';

	if (!memberName) {
		throw new Error('memberName is required');
	}

	await actor.attemptsTo(CreateMember(memberName));
	await actor.attemptsTo(notes<MemberUiNotes>().set('lastMemberId', 'member-charlie-walker'));

	const onProfileSave = async (profile: MemberProfileFormValues): Promise<boolean> => {
		await actor.attemptsTo(notes<MemberUiNotes>().set('memberUpdated', true), notes<MemberUiNotes>().set('updatedMemberProfile', profile));
		return true;
	};
	const profileData: SharedMemberProfileContainerMemberFieldsFragment = {
		id: 'member-charlie-walker',
		memberName,
		profile: {
			name: '',
			email: '',
			bio: '',
			showInterests: false,
			showEmail: false,
			showProfile: false,
			showLocation: false,
			showProperties: false,
		},
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	await actor.attemptsTo(
		notes<MemberUiNotes>().set('memberUpdated', false),
		Render.component(
			<MemberProfile
				data={profileData}
				isAdmin
				loading={false}
				onSave={onProfileSave}
			/>,
			{ wrapper: wrapOcomComponent() },
		),
	);
});

Then('the member should be created successfully in {string}', async (_communityName: string) => {
	const submitted = await actorInTheSpotlight().answer(MemberCreatedFlag());
	if (!submitted) {
		throw new Error('Expected member form to be submitted');
	}
});

When('{word} attempts to create a member in {string} with:', async (actorName: string, _communityName: string, dataTable: DataTable) => {
	const actor = actorCalled(actorName);
	const details = GherkinDataTable.from(dataTable).rowsHash<MemberDetails>();
	await actor.attemptsTo(notes<MemberUiNotes>().set('memberCreated', false), notes<MemberUiNotes>().set('memberValidationError', ''), CreateMember(details.memberName?.trim() ?? ''));
	const page: AcceptanceUiMemberCreatePage = new MemberCreatePage(new DomPageAdapter(RenderInDom.as(actor).container));
	await actor.attemptsTo(notes<MemberUiNotes>().set('memberValidationError', (await page.firstValidationError.textContent()) ?? ''));
});

Then('she should see a member error for {string}', async (fieldName: string) => {
	const error = await actorInTheSpotlight().answer(notes<MemberUiNotes>().get('memberValidationError'));
	const isFieldMentioned = error.toLowerCase().includes(fieldName.toLowerCase());
	if (!error || (!isFieldMentioned && !/cannot be empty|required|missing|invalid|must not be empty|please input|already associated/i.test(error))) {
		throw new Error(`Expected a validation error related to "${fieldName}", but got: "${error}"`);
	}
});

Then('no new member should be created in {string}', async (_communityName: string) => {
	if (await actorInTheSpotlight().answer(MemberCreatedFlag())) {
		throw new Error('Expected no member to be created, but the form was submitted');
	}
});
