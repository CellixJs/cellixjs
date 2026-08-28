import { SEEDED_COMMUNITY } from '@ocom-verification/verification-shared/test-data';
import { type Actor, notes, Task } from '@serenity-js/core';
import { QueryCommunity } from '../../../shared/abilities/query-community.ts';
import type { CommunityNotes } from '../notes/community-notes.ts';

/**
 * Task that fetches a community by id through the API and records the
 * viewed details in actor notes for follow-up assertions.
 */
export class ViewCommunityDetails extends Task {
	static ofSeededCommunity() {
		return new ViewCommunityDetails(SEEDED_COMMUNITY.id);
	}

	static ofCommunityWithId(communityId: string) {
		return new ViewCommunityDetails(communityId);
	}

	private constructor(private readonly communityId: string) {
		super(`views the details of community "${communityId}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const community = await QueryCommunity.as(actor).byId(actor, this.communityId);
		if (!community) {
			throw new Error(`Community "${this.communityId}" was not found through the API`);
		}

		await actor.attemptsTo(notes<CommunityNotes>().set('lastCommunityId', community.id), notes<CommunityNotes>().set('lastViewedCommunityName', community.name));
	}

	override toString = () => `views the details of community "${this.communityId}"`;
}
