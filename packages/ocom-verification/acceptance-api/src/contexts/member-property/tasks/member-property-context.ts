import { type Actor, notes } from '@serenity-js/core';
import type { MemberPropertyNotes } from '../notes/member-property-notes.ts';

export interface MemberPropertyCommunityContext {
	communityId: string;
	communityName: string;
	managerMemberId: string;
}

interface MemberPropertyActorContext extends MemberPropertyCommunityContext {
	actingMemberId: string;
}

export async function initialiseMemberPropertyNotes(actor: Actor, context: MemberPropertyActorContext): Promise<void> {
	await actor.attemptsTo(
		notes<MemberPropertyNotes>().set('activeCommunityId', context.communityId),
		notes<MemberPropertyNotes>().set('activeCommunityName', context.communityName),
		notes<MemberPropertyNotes>().set('actingMemberId', context.actingMemberId),
		notes<MemberPropertyNotes>().set('managerMemberId', context.managerMemberId),
		notes<MemberPropertyNotes>().set('foreignMemberId', null),
		notes<MemberPropertyNotes>().set('knownPropertyIds', {}),
		notes<MemberPropertyNotes>().set('listedPropertyNames', []),
		notes<MemberPropertyNotes>().set('directoryStatus', null),
		notes<MemberPropertyNotes>().set('directoryError', null),
		notes<MemberPropertyNotes>().set('lastOperationStatus', null),
		notes<MemberPropertyNotes>().set('lastOperationError', null),
		notes<MemberPropertyNotes>().set('lastReadStatus', null),
		notes<MemberPropertyNotes>().set('lastReadError', null),
		notes<MemberPropertyNotes>().set('lastReadPropertyId', null),
		notes<MemberPropertyNotes>().set('baselinePropertyNames', []),
	);
}

export async function memberPropertyCommunityOf(actor: Actor): Promise<MemberPropertyCommunityContext> {
	const communityId = await actor.answer(notes<MemberPropertyNotes>().get('activeCommunityId'));
	const communityName = await actor.answer(notes<MemberPropertyNotes>().get('activeCommunityName'));
	const managerMemberId = await actor.answer(notes<MemberPropertyNotes>().get('managerMemberId'));
	if (!communityId || !managerMemberId) {
		throw new Error('No member Property community is available. Did the accepted own-property member setup run?');
	}
	return { communityId, communityName, managerMemberId };
}

export async function memberPropertyIdKnownTo(actor: Actor, propertyName: string): Promise<string | undefined> {
	const propertyIds = await actor.answer(notes<MemberPropertyNotes>().get('knownPropertyIds'));
	return propertyIds?.[propertyName];
}

export async function rememberMemberPropertyId(actor: Actor, propertyName: string, propertyId: string): Promise<void> {
	const current = (await actor.answer(notes<MemberPropertyNotes>().get('knownPropertyIds'))) ?? {};
	await actor.attemptsTo(notes<MemberPropertyNotes>().set('knownPropertyIds', { ...current, [propertyName]: propertyId }));
}
