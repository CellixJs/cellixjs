import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, notes, Question, type UsesAbilities } from '@serenity-js/core';
import { MEMBER_ROLE_PROPERTY_PERMISSIONS_QUERY, type MemberRolePropertyPermissionsResult } from '../../../shared/graphql/property-operations.ts';
import type { PropertyNotes } from '../notes/property-notes.ts';

/**
 * Question that reads whether the acting member's end-user role grants the
 * manage-properties permission, live from the API.
 */
export class PropertyManagerPermission extends Question<Promise<boolean>> {
	static granted(): PropertyManagerPermission {
		return new PropertyManagerPermission();
	}

	private constructor() {
		super("the acting member's manage-properties permission");
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<boolean> {
		const memberId = await this.readActingMemberId(actor);
		if (!memberId) {
			throw new Error('No acting member id found in actor notes. Did the actor become a community member first?');
		}

		const response = await GraphQLClient.as(actor as unknown as Actor).execute(MEMBER_ROLE_PROPERTY_PERMISSIONS_QUERY, { id: memberId });
		const member = response.data['member'] as MemberRolePropertyPermissionsResult | null;
		if (!member?.role) {
			throw new Error(`Member ${memberId} has no end-user role to read property permissions from`);
		}
		return member.role.permissions.propertyPermissions.canManageProperties === true;
	}

	override toString = () => "the acting member's manage-properties permission";

	private async readActingMemberId(actor: AnswersQuestions & UsesAbilities): Promise<string | undefined> {
		try {
			return await actor.answer(notes<PropertyNotes>().get('actingMemberId'));
		} catch {
			return undefined;
		}
	}
}
