import { type Actor, notes, Task } from '@serenity-js/core';
import { QueryCommunity } from '../../../shared/abilities/query-community.ts';
import type { CommunityNotes } from '../notes/community-notes.ts';

/**
 * Task that fetches the current community (resolved from the actor's
 * principal hints, like the community portal does) and records the viewed
 * details in actor notes for follow-up assertions.
 */
export class ViewCurrentCommunity extends Task {
	static now() {
		return new ViewCurrentCommunity();
	}

	private constructor() {
		super('views the current community');
	}

	async performAs(actor: Actor): Promise<void> {
		const community = await QueryCommunity.as(actor).current(actor);
		if (!community) {
			throw new Error('No current community was resolved for the actor. Are the community principal hints registered?');
		}

		await actor.attemptsTo(notes<CommunityNotes>().set('lastCommunityId', community.id), notes<CommunityNotes>().set('lastViewedCommunityName', community.name));
	}

	override toString = () => 'views the current community';
}
