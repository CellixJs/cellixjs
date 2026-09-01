import { findMemberPropertyFixtureRecord } from '@ocom-verification/verification-shared/test-data';
import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { mongoConnectionString, mongoDbName } from '../../../servers/test-mongo-server.ts';
import { waitUntil } from '../../property/abilities/admin-portal-page.ts';
import type { MemberPropertyE2ENotes } from '../notes/member-property-notes.ts';

/** Records a fixture property's id in scenario-local member notes, never in the admin context's shared id map. */
export const RecordMemberPropertyId = (propertyName: string) =>
	Interaction.where(the`#actor records the member Property id for "${propertyName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const communityId = await actor.answer(notes<MemberPropertyE2ENotes>().get('communityId'));
		let property = await findMemberPropertyFixtureRecord({ connectionString: mongoConnectionString(), dbName: mongoDbName }, communityId, propertyName);
		if (!property) {
			await waitUntil(
				async () => {
					property = await findMemberPropertyFixtureRecord({ connectionString: mongoConnectionString(), dbName: mongoDbName }, communityId, propertyName);
					return property !== undefined;
				},
				`Could not record the member Property id for "${propertyName}" because it was not persisted`,
				5_000,
			);
		}
		if (!property) {
			throw new Error(`Could not record the member Property id for "${propertyName}" because it was not persisted`);
		}
		const ids = await actor.answer(notes<MemberPropertyE2ENotes>().get('memberPropertyIds'));
		await actor.attemptsTo(notes<MemberPropertyE2ENotes>().set('memberPropertyIds', { ...ids, [propertyName]: property.id }));
	});
