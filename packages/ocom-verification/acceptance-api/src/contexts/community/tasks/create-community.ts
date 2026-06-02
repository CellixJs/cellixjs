import { CreateCommunity as CreateCommunityAbility } from '@ocom-verification/verification-shared/abilities';
import { type Actor, notes, Task } from '@serenity-js/core';
import type { CommunityDetails, CommunityNotes } from '../notes/community-notes.ts';

export class CreateCommunity extends Task {
	static withName(name: string) {
		return new CreateCommunity({ name });
	}

	static with(details: CommunityDetails) {
		return new CreateCommunity(details);
	}

	private constructor(private readonly details: CommunityDetails) {
		super(`creates a community named "${details.name}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const community = await CreateCommunityAbility.as(actor).performAs(actor, this.details);

		await actor.attemptsTo(notes<CommunityNotes>().set('lastCommunityId', community.id ?? ''), notes<CommunityNotes>().set('lastCommunityName', community.name), notes<CommunityNotes>().set('lastCommunityStatus', 'SUCCESS'));
	}

	override toString = () => `creates a community named "${this.details.name}"`;
}
