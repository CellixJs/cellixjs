import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { actors, END_USER_IDS } from '@ocom-verification/verification-shared/test-data';
import { type Actor, notes, Task } from '@serenity-js/core';
import { getActorContext, getActorToken, setActorContext, setActorToken, userTokenFor } from '../../../shared/abilities/actor-auth.ts';
import { ProvisionMemberPropertyFixture as ProvisionMemberPropertyFixtureAbility } from '../../../shared/abilities/provision-member-property-fixture.ts';
import { PROPERTY_FULL_CREATE_MUTATION, type PropertyFullMutationResult } from '../../../shared/graphql/property-field-operations.ts';
import type { MemberPropertyNotes } from '../notes/member-property-notes.ts';
import { memberPropertyCommunityOf, rememberMemberPropertyId } from './member-property-context.ts';

const FOREIGN_MEMBER_NAME = 'Foreign Same-Community Owner';

/**
 * Adds a second accepted member to the current community for foreign-owner
 * directory and authorization scenarios.
 */
export class MakeForeignMemberAvailable extends Task {
	static inCurrentCommunity(): MakeForeignMemberAvailable {
		return new MakeForeignMemberAvailable();
	}

	private constructor() {
		super('makes a foreign same-community member available for property ownership');
	}

	async performAs(actor: Actor): Promise<void> {
		const community = await memberPropertyCommunityOf(actor);
		const foreignMember = await ProvisionMemberPropertyFixtureAbility.as(actor).performAs(actor, {
			communityId: community.communityId,
			endUserId: END_USER_IDS.otherCommunityOwner,
			memberName: FOREIGN_MEMBER_NAME,
			firstName: actors.OtherCommunityOwner.givenName,
			lastName: actors.OtherCommunityOwner.familyName,
			accountStatus: 'ACCEPTED',
			canEditOwnProperty: false,
			canManageProperties: false,
		});
		await actor.attemptsTo(notes<MemberPropertyNotes>().set('foreignMemberId', foreignMember.memberId));
	}
}

type MemberPropertyOwner = 'current-member' | 'foreign-member';

/**
 * Uses the established manager identity only to arrange an existing listing.
 * The original actor identity is restored before the scenario action begins.
 */
export class ArrangeMemberProperty extends Task {
	static ownedByCurrentMember(propertyName: string): ArrangeMemberProperty {
		return new ArrangeMemberProperty(propertyName, 'current-member');
	}

	static ownedByForeignMember(propertyName: string): ArrangeMemberProperty {
		return new ArrangeMemberProperty(propertyName, 'foreign-member');
	}

	private constructor(
		private readonly propertyName: string,
		private readonly owner: MemberPropertyOwner,
	) {
		super(`arranges the member Property "${propertyName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const community = await memberPropertyCommunityOf(actor);
		const ownerId = await this.ownerId(actor);
		const priorToken = getActorToken(actor.name);
		const priorContext = getActorContext(actor.name);
		setActorToken(actor.name, userTokenFor(actors.CommunityOwner.name));
		setActorContext(actor.name, { memberId: community.managerMemberId, communityId: community.communityId });

		try {
			const response = await GraphQLClient.as(actor).execute(PROPERTY_FULL_CREATE_MUTATION, {
				input: {
					propertyName: this.propertyName,
					ownerId,
				},
			});
			const result = response.data.propertyCreate as PropertyFullMutationResult | undefined;
			if (result?.status.success !== true || !result.property?.id) {
				throw new Error(`Could not arrange the member Property "${this.propertyName}": ${result?.status.errorMessage ?? 'no property was returned'}`);
			}
			await rememberMemberPropertyId(actor, this.propertyName, result.property.id);
		} finally {
			setActorToken(actor.name, priorToken);
			setActorContext(actor.name, priorContext ?? null);
		}
	}

	private async ownerId(actor: Actor): Promise<string> {
		if (this.owner === 'current-member') {
			const currentMemberId = await actor.answer(notes<MemberPropertyNotes>().get('actingMemberId'));
			if (!currentMemberId) {
				throw new Error('No current member id is available to arrange an owned member Property');
			}
			return currentMemberId;
		}
		const foreignMemberId = await actor.answer(notes<MemberPropertyNotes>().get('foreignMemberId'));
		if (!foreignMemberId) {
			throw new Error('No foreign member is available. Arrange a foreign same-community member before creating its property.');
		}
		return foreignMemberId;
	}
}
