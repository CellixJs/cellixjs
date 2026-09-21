import { type AnswersQuestions, notes, type UsesAbilities } from '@serenity-js/core';
import type { CommunityNotes } from '../notes/community-notes.ts';

export async function readCommunityNote<K extends keyof CommunityNotes>(actor: AnswersQuestions & UsesAbilities, key: K): Promise<CommunityNotes[K] | undefined> {
	try {
		return await actor.answer(notes<CommunityNotes>().get(key));
	} catch {
		return undefined;
	}
}

export async function requireCommunityId(actor: AnswersQuestions & UsesAbilities): Promise<string> {
	const communityId = await readCommunityNote(actor, 'lastCommunityId');
	if (!communityId) {
		throw new Error('No community id found in actor notes. Did the actor create a community first?');
	}
	return communityId;
}
