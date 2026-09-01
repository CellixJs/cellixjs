import { actors, END_USER_IDS, provisionMemberPropertyFixture } from '@ocom-verification/verification-shared/test-data';
import { type Actor, Interaction, notes, Task, the } from '@serenity-js/core';
import { mongoConnectionString, mongoDbName } from '../../../servers/test-mongo-server.ts';
import { OpenPropertyDetail } from '../../property/interactions/open-property-detail.ts';
import { SelectPropertyOwner } from '../../property/interactions/select-property-owner.ts';
import { SubmitPropertySave } from '../../property/interactions/submit-property-save.ts';
import { CreatePropertyViaForm } from '../../property/tasks/create-property.ts';
import { RecordMemberPropertyId } from '../interactions/record-member-property-id.ts';
import type { MemberPropertyE2ENotes } from '../notes/member-property-notes.ts';
import { FOREIGN_MEMBER_NAME, MAYA_MEMBER_NAME } from './establish-member-property-community.ts';

/** Provisions the foreign same-community owner required by read-only detail scenarios. */
export const MakeForeignMemberAvailable = () =>
	Interaction.where(the`#actor makes a foreign same-community member available`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const communityId = await actor.answer(notes<MemberPropertyE2ENotes>().get('communityId'));
		await provisionMemberPropertyFixture(
			{ connectionString: mongoConnectionString(), dbName: mongoDbName },
			{
				communityId,
				endUserId: END_USER_IDS.otherCommunityOwner,
				memberName: FOREIGN_MEMBER_NAME,
				firstName: actors.OtherCommunityOwner.givenName,
				lastName: actors.OtherCommunityOwner.familyName,
				accountStatus: 'ACCEPTED',
				canEditOwnProperty: false,
				canManageProperties: false,
			},
		);
	});

/**
 * Reuses the live admin Property workflow to arrange fixtures, preserving the
 * existing manager regression surface while member routes are added later.
 */
export const ArrangeForeignMemberProperty = (propertyName: string) =>
	Task.where(
		the`#actor arranges a foreign member Property "${propertyName}"`,
		CreatePropertyViaForm({ propertyName }),
		OpenPropertyDetail(propertyName),
		SelectPropertyOwner(FOREIGN_MEMBER_NAME),
		SubmitPropertySave(),
		RecordMemberPropertyId(propertyName),
	);

export const ArrangeOwnMemberProperty = (propertyName: string) =>
	Task.where(
		the`#actor arranges an own member Property "${propertyName}"`,
		CreatePropertyViaForm({ propertyName }),
		OpenPropertyDetail(propertyName),
		SelectPropertyOwner(MAYA_MEMBER_NAME),
		SubmitPropertySave(),
		RecordMemberPropertyId(propertyName),
	);
