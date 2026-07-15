import { Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import type { MemberE2ENotes } from '../notes/member-notes.ts';
import { SeedEndUserRole, UpdateMemberRole } from '../tasks/update-member-role.ts';

let lastActorName = '';

Given('a role {string} exists in {string}', async (roleName: string, communityName: string) => {
	const actor = actorInTheSpotlight();
	const communityIds = await actor.answer(notes<MemberE2ENotes>().get('communityIdsByName'));
	const communityId = communityIds[communityName];
	if (!communityId) throw new Error(`Unknown community "${communityName}"`);
	await actor.attemptsTo(SeedEndUserRole(roleName, communityName, communityId));
});

When('{word} changes member {string} in {string} to role {string}', async (actorName: string, _memberName: string, communityName: string, roleName: string) => {
	lastActorName = actorName;
	await actorCalled(actorName).attemptsTo(UpdateMemberRole(communityName, roleName));
});

When('{word} attempts to change member {string} in {string} to role {string}', async (actorName: string, _memberName: string, communityName: string, roleName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	try {
		await actor.attemptsTo(UpdateMemberRole(communityName, roleName));
	} catch (error) {
		await actor.attemptsTo(notes<MemberE2ENotes>().set('errorMessage', error instanceof Error ? error.message : String(error)));
	}
});

Then('member {string} should have role {string} in {string}', async (_memberName: string, roleName: string, _communityName: string) => {
	const role = await actorCalled(lastActorName).answer(notes<MemberE2ENotes>().get('lastMemberRoleName'));
	if (role !== roleName) throw new Error(`Expected member role "${roleName}", got "${role ?? 'none'}"`);
});

Then('member {string} should not have role {string} in {string}', async (_memberName: string, roleName: string, _communityName: string) => {
	const role = await actorCalled(lastActorName)
		.answer(notes<MemberE2ENotes>().get('lastMemberRoleName'))
		.catch(() => null);
	if (role === roleName) throw new Error(`Expected member not to have role "${roleName}"`);
});
