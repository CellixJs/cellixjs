import { TaskStep } from '@cellix/serenity-framework/serenity';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { seedEndUserRole } from '@ocom-verification/verification-shared/test-data';
import { type Actor, Interaction, notes, Task, the } from '@serenity-js/core';
import { mongoDbName, testMongoServer } from '../../../servers/test-mongo-server.ts';
import { buildUrl, getHostnames } from '../../../shared/environment/test-environment.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

const apiUrl = buildUrl(getHostnames().api, '/api/graphql');

const membersForCurrentEndUserQuery = `
	query MembersForCurrentEndUser {
		membersForCurrentEndUser {
			id
			isAdmin
			community { id }
		}
	}
`;

const memberRoleUpdateMutation = `
	mutation MemberRoleUpdate($input: UpdateMemberRoleInput!) {
		memberRoleUpdate(input: $input) {
			status { success errorMessage }
			member { role { roleName } }
		}
	}
`;

type MembershipPayload = {
	data?: { membersForCurrentEndUser?: Array<{ id?: string; isAdmin?: boolean; community?: { id?: string } }> };
	errors?: Array<{ message?: string }>;
};

type MemberRoleUpdatePayload = {
	data?: { memberRoleUpdate?: { status?: { success?: boolean; errorMessage?: string | null }; member?: { role?: { roleName?: string | null } | null } | null } };
	errors?: Array<{ message?: string }>;
};

function errorMessage(payload: { errors?: Array<{ message?: string }> } | null): string | null {
	return (
		payload?.errors
			?.map((error) => error.message)
			.filter(Boolean)
			.join('; ') ?? null
	);
}

async function accessToken(actor: Actor): Promise<string> {
	const { page } = BrowseTheWeb.withActor(actor);
	const token = await page.evaluate(() => {
		for (const storage of [sessionStorage, localStorage]) {
			for (let index = 0; index < storage.length; index += 1) {
				const key = storage.key(index);
				if (!key?.startsWith('oidc.user:')) continue;
				const value = storage.getItem(key);
				if (!value) continue;
				const user = JSON.parse(value) as { access_token?: unknown };
				if (typeof user.access_token === 'string') return user.access_token;
			}
		}
		return null;
	});
	if (!token) throw new Error('Missing browser OAuth access token');
	return token;
}

export const SeedEndUserRole = (roleName: string, communityName: string, communityId: string) =>
	Task.where(
		the`#actor seeds role "${roleName}" in "${communityName}"`,
		new TaskStep<Actor>('#actor records the seeded role', async (actor) => {
			const roleId = await seedEndUserRole({ connectionString: testMongoServer.getConnectionString(), dbName: mongoDbName }, { communityId, roleName });
			const roleIdsByCommunityName = await actor.answer(notes<MemberE2ENotes>().get('roleIdsByCommunityName')).catch(() => ({}) as Record<string, Record<string, string>>);
			await actor.attemptsTo(
				notes<MemberE2ENotes>().set('roleIdsByCommunityName', {
					...roleIdsByCommunityName,
					[communityName]: { ...roleIdsByCommunityName[communityName], [roleName]: roleId },
				}),
			);
		}),
	);

export const UpdateMemberRole = (communityName: string, roleName: string) =>
	Interaction.where(the`#actor assigns role "${roleName}" in "${communityName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const communityIds = await actor.answer(notes<MemberE2ENotes>().get('communityIdsByName'));
		const roleIds = await actor.answer(notes<MemberE2ENotes>().get('roleIdsByCommunityName'));
		const memberId = await actor.answer(notes<MemberE2ENotes>().get('lastMemberId'));
		const communityId = communityIds[communityName];
		const roleId = Object.values(roleIds)
			.map((roles) => roles[roleName])
			.find(Boolean);
		if (!communityId || !memberId || !roleId) throw new Error(`Missing role update state for "${roleName}" in "${communityName}"`);

		const token = await accessToken(actor);
		const membershipsResponse = await BrowseTheWeb.withActor(actor).page.request.post(apiUrl, {
			data: { query: membersForCurrentEndUserQuery },
			headers: { Authorization: `Bearer ${token}` },
		});
		const membershipsPayload = (await membershipsResponse.json()) as MembershipPayload;
		const principalMemberId = membershipsPayload.data?.membersForCurrentEndUser?.find((member) => member.isAdmin && member.community?.id === communityId)?.id;
		if (!principalMemberId) throw new Error(`No administrator membership found for community "${communityId}"`);

		const response = await BrowseTheWeb.withActor(actor).page.request.post(apiUrl, {
			data: { query: memberRoleUpdateMutation, variables: { input: { memberId, roleId, reason: 'Role assignment verification' } } },
			headers: { Authorization: `Bearer ${token}`, 'x-community-id': communityId, 'x-member-id': principalMemberId },
		});
		const payload = (await response.json().catch(() => null)) as MemberRoleUpdatePayload | null;
		const result = payload?.data?.memberRoleUpdate;
		const message = result?.status?.errorMessage ?? errorMessage(payload) ?? `Member role update request failed with HTTP ${response.status()}`;
		if (!response.ok() || result?.status?.success !== true) {
			await actor.attemptsTo(notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		await actor.attemptsTo(notes<MemberE2ENotes>().set('lastMemberRoleName', result.member?.role?.roleName ?? null), notes<MemberE2ENotes>().set('errorMessage', null));
	});
