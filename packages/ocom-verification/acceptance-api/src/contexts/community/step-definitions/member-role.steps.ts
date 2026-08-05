import { Given, Then, When } from '@cucumber/cucumber';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import type { MemberNotes } from '../notes/member-notes.ts';
import { CommunityIdNamed } from '../questions/community-id-named.ts';
import { MemberRoleName } from '../questions/member-role-name.ts';
import { SeedEndUserRole } from '../tasks/seed-end-user-role.ts';
import { UpdateMemberRole } from '../tasks/update-member-role.ts';

let lastActorName = actors.CommunityOwner.name;

Given('a role {string} exists in {string}', async (roleName: string, communityName: string) => {
	const actor = actorInTheSpotlight();
	const communityId = await actor.answer(CommunityIdNamed.called(communityName));
	await actor.attemptsTo(SeedEndUserRole.named(roleName, communityName, communityId));
});

When('{word} changes member {string} in {string} to role {string}', async (actorName: string, _memberName: string, communityName: string, roleName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const roleIds = await actor.answer(notes<MemberNotes>().get('roleIdsByCommunityName'));
	const communityId = await actor.answer(CommunityIdNamed.called(communityName));
	const roleId = roleIds[communityName]?.[roleName];
	if (!roleId) throw new Error(`Missing role "${roleName}" in "${communityName}"`);
	await actor.attemptsTo(UpdateMemberRole.with(roleId, communityId));
});

When('{word} attempts to change member {string} in {string} to role {string}', async (actorName: string, _memberName: string, communityName: string, roleName: string) => {
	lastActorName = actorName;
	const actor = actorCalled(actorName);
	const roleIds = await actor.answer(notes<MemberNotes>().get('roleIdsByCommunityName'));
	const communityId = await actor.answer(CommunityIdNamed.called(communityName));
	const roleId = Object.values(roleIds)
		.map((roles) => roles[roleName])
		.find(Boolean);
	if (!roleId) throw new Error(`Missing role "${roleName}"`);
	try {
		await actor.attemptsTo(UpdateMemberRole.with(roleId, communityId));
	} catch (error) {
		await actor.attemptsTo(notes<MemberNotes>().set('lastValidationError', error instanceof Error ? error.message : String(error)));
	}
});

Then('member {string} should have role {string} in {string}', async (_memberName: string, roleName: string, _communityName: string) => {
	const actor = actorCalled(lastActorName);
	if ((await actor.answer(MemberRoleName.fromLastUpdate())) !== roleName) throw new Error(`Expected member role "${roleName}"`);
});

Then('member {string} should not have role {string} in {string}', async (_memberName: string, roleName: string, _communityName: string) => {
	const actor = actorCalled(lastActorName);
	if ((await actor.answer(MemberRoleName.fromLastUpdate()).catch(() => null)) === roleName) throw new Error(`Expected member not to have role "${roleName}"`);
});
