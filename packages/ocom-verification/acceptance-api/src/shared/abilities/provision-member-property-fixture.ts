import { type MemberPropertyFixture, type MemberPropertyFixtureIds, provisionMemberPropertyFixture } from '@ocom-verification/verification-shared/test-data';
import { Ability, type Actor } from '@serenity-js/core';
import { mongoConnectionString, mongoDbName } from '../../servers/test-mongo-server.ts';

type ProvisionMemberPropertyFixtureHandler = (actor: Actor, fixture: MemberPropertyFixture) => Promise<MemberPropertyFixtureIds>;

/**
 * Arrangement-only ability that provisions a member and role directly in the
 * verification database. Product behavior is always exercised through GraphQL;
 * direct writes only create principals unavailable through the public API.
 */
export class ProvisionMemberPropertyFixture extends Ability {
	constructor(private readonly handler: ProvisionMemberPropertyFixtureHandler) {
		super();
	}

	static using(handler: ProvisionMemberPropertyFixtureHandler): ProvisionMemberPropertyFixture {
		return new ProvisionMemberPropertyFixture(handler);
	}

	async performAs(actor: Actor, fixture: MemberPropertyFixture): Promise<MemberPropertyFixtureIds> {
		return await this.handler(actor, fixture);
	}
}

export function provisionMemberPropertyFixtureAbility(): ProvisionMemberPropertyFixture {
	return ProvisionMemberPropertyFixture.using(async (_actor, fixture) => await provisionMemberPropertyFixture({ connectionString: mongoConnectionString(), dbName: mongoDbName }, fixture));
}
