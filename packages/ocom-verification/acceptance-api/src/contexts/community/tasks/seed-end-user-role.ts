import { seedEndUserRole } from '@ocom-verification/verification-shared/test-data';
import { type Actor, notes, Task } from '@serenity-js/core';
import { mongoDbName, testMongoServer } from '../../../servers/test-mongo-server.ts';
import type { MemberNotes } from '../notes/member-notes.ts';

export class SeedEndUserRole extends Task {
	static named(roleName: string, communityName: string, communityId: string): SeedEndUserRole {
		return new SeedEndUserRole(roleName, communityName, communityId);
	}

	private constructor(
		private readonly roleName: string,
		private readonly communityName: string,
		private readonly communityId: string,
	) {
		super(`seeds role "${roleName}" in "${communityName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const roleId = await seedEndUserRole({ connectionString: testMongoServer.getConnectionString(), dbName: mongoDbName }, { communityId: this.communityId, roleName: this.roleName });
		const roleIdsByCommunityName = await actor.answer(notes<MemberNotes>().get('roleIdsByCommunityName')).catch(() => ({}) as Record<string, Record<string, string>>);
		await actor.attemptsTo(
			notes<MemberNotes>().set('roleIdsByCommunityName', {
				...roleIdsByCommunityName,
				[this.communityName]: { ...roleIdsByCommunityName[this.communityName], [this.roleName]: roleId },
			}),
		);
	}
}
