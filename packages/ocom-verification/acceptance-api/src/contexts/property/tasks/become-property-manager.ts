import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, notes, Task } from '@serenity-js/core';
import { setActorContext } from '../../../shared/abilities/actor-auth.ts';
import { CreateCommunity as CreateCommunityAbility } from '../../../shared/abilities/create-community.ts';
import { type CurrentCommunityMemberResult, MEMBER_FOR_CURRENT_COMMUNITY_QUERY } from '../../../shared/graphql/property-operations.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';

const MEMBER_PROVISIONING_TIMEOUT_MS = 10_000;
const MEMBER_PROVISIONING_POLL_INTERVAL_MS = 100;

let communitySequence = 0;

function nextCommunityName(): string {
	communitySequence += 1;
	return `Property Test Community ${Date.now()}-${communitySequence}`;
}

function delay(milliseconds: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Given-glue task that makes the actor a property manager the same way
 * production does: create a community, wait for the CommunityCreated
 * integration event to provision the admin member and default "admin" role
 * (which grants `canManageProperties`), resolve the provisioned member id via
 * the `memberForCurrentCommunity` query, and register the member/community
 * context headers used by every subsequent request from this actor.
 */
export class BecomePropertyManager extends Task {
	static ofANewCommunity() {
		return new BecomePropertyManager();
	}

	private constructor() {
		super('becomes the property manager of a newly created community');
	}

	async performAs(actor: Actor): Promise<void> {
		const communityName = nextCommunityName();
		const community = await CreateCommunityAbility.as(actor).performAs(actor, { name: communityName });
		const communityId = community.id ?? '';
		if (!communityId) {
			throw new Error('Community creation returned no id while arranging a property manager');
		}

		const member = await this.waitForProvisionedMember(actor, communityId);

		setActorContext(actor.name, { memberId: member.id, communityId });

		await actor.attemptsTo(notes<PropertyNotes>().set('activeCommunityId', communityId), notes<PropertyNotes>().set('activeCommunityName', communityName), notes<PropertyNotes>().set('actingMemberId', member.id));
	}

	override toString = () => 'becomes the property manager of a newly created community';

	/** The CommunityCreated handler runs asynchronously after the mutation returns, so poll until the member exists. */
	private async waitForProvisionedMember(actor: Actor, communityId: string): Promise<CurrentCommunityMemberResult> {
		const graphql = GraphQLClient.as(actor);
		const deadline = Date.now() + MEMBER_PROVISIONING_TIMEOUT_MS;

		for (;;) {
			const response = await graphql.execute(MEMBER_FOR_CURRENT_COMMUNITY_QUERY, { communityId });
			const member = response.data['memberForCurrentCommunity'] as CurrentCommunityMemberResult | null;
			if (member?.id) {
				return member;
			}
			if (Date.now() >= deadline) {
				throw new Error(`No member was provisioned for community ${communityId} within ${MEMBER_PROVISIONING_TIMEOUT_MS}ms. Are the CommunityCreated integration event handlers registered in the test server?`);
			}
			await delay(MEMBER_PROVISIONING_POLL_INTERVAL_MS);
		}
	}
}
