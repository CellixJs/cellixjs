import { SEEDED_COMMUNITY } from '@ocom-verification/verification-shared/test-data';
import { type Actor, notes, Task } from '@serenity-js/core';
import { UpdateCommunity as UpdateCommunityAbility } from '../../../shared/abilities/update-community.ts';
import type { CommunityNotes, CommunitySettingsDetails } from '../notes/community-notes.ts';

/**
 * Task that updates the settings of the community the scenario is acting on
 * (the community noted as `lastCommunityId`, defaulting to the seeded community).
 */
export class UpdateCommunitySettings extends Task {
	static with(details: CommunitySettingsDetails) {
		return new UpdateCommunitySettings(details);
	}

	private constructor(private readonly details: CommunitySettingsDetails) {
		super(`updates the community settings (${Object.keys(details).join(', ')})`);
	}

	async performAs(actor: Actor): Promise<void> {
		const targetCommunityId = (await readNote(actor, 'lastCommunityId')) ?? SEEDED_COMMUNITY.id;

		const community = await UpdateCommunityAbility.as(actor).performAs(actor, {
			id: targetCommunityId,
			...this.details,
		});

		await actor.attemptsTo(notes<CommunityNotes>().set('lastCommunityId', community.id), notes<CommunityNotes>().set('lastCommunityName', community.name), notes<CommunityNotes>().set('lastCommunityStatus', 'SUCCESS'));
	}

	override toString = () => `updates the community settings (${Object.keys(this.details).join(', ')})`;
}

async function readNote(actor: Actor, key: keyof CommunityNotes): Promise<string | undefined> {
	try {
		return (await actor.answer(notes<CommunityNotes>().get(key))) || undefined;
	} catch {
		return undefined;
	}
}
