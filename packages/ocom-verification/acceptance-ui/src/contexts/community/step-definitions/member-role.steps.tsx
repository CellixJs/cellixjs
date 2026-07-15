import { Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import type { MemberUiNotes } from '../notes/member-notes.ts';
import { DisplayedMemberRole } from '../questions/displayed-member-role.ts';
import { SeedEndUserRole, UpdateMemberRole } from '../tasks/update-member-role.tsx';

let lastActorName = '';

Given('a role {string} exists in {string}', async (roleName: string, communityName: string) => {
	await actorInTheSpotlight().attemptsTo(SeedEndUserRole(roleName, communityName));
});

When('{word} changes member {string} in {string} to role {string}', async (actorName: string, _memberName: string, communityName: string, roleName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(UpdateMemberRole.with(roleName, communityName));
});

When('{word} attempts to change member {string} in {string} to role {string}', async (actorName: string, _memberName: string, communityName: string, roleName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	try {
		await actor.attemptsTo(UpdateMemberRole.with(roleName, communityName));
	} catch (error) {
		await actor.attemptsTo(notes<MemberUiNotes>().set('memberValidationError', error instanceof Error ? error.message : String(error)));
	}
});

Then('member {string} should have role {string} in {string}', async (_memberName: string, roleName: string, _communityName: string) => {
	if (!(await actorCalled(lastActorName).answer(DisplayedMemberRole(roleName)))) {
		throw new Error(`Expected member role "${roleName}" to be displayed`);
	}
});

Then('member {string} should not have role {string} in {string}', async (_memberName: string, roleName: string, _communityName: string) => {
	const actor = actorCalled(lastActorName);
	if (await actor.answer(DisplayedMemberRole(roleName))) {
		throw new Error(`Expected member not to display role "${roleName}"`);
	}
});
