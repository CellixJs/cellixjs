import { SEEDED_COMMUNITY } from '@ocom-verification/verification-shared/test-data';
import { type Actor, notes, Task } from '@serenity-js/core';
import { QueryCommunity } from '../../../shared/abilities/query-community.ts';
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

		if (community.id !== targetCommunityId) {
			throw new Error(`Community update returned "${community.id}" instead of the requested community "${targetCommunityId}"`);
		}

		const persistedCommunity = await QueryCommunity.as(actor).byId(actor, targetCommunityId);
		if (!persistedCommunity) {
			throw new Error(`Community "${targetCommunityId}" was not found after the settings update`);
		}

		for (const [fieldName, expectedValue] of Object.entries(this.details) as Array<[keyof CommunitySettingsDetails, string]>) {
			const actualValue = String(persistedCommunity[fieldName] ?? '');
			if (actualValue !== expectedValue) {
				throw new Error(`Community "${targetCommunityId}" did not persist ${fieldName}: expected "${expectedValue}" but got "${actualValue}"`);
			}
		}

		await actor.attemptsTo(
			notes<CommunityNotes>().set('lastCommunityId', targetCommunityId),
			notes<CommunityNotes>().set('lastCommunityName', persistedCommunity.name),
			notes<CommunityNotes>().set('lastCommunityStatus', 'SUCCESS'),
		);
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
