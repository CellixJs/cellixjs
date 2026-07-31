import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { communityPortalPageOf, settingsPageOn } from '../abilities/community-portal-page.ts';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';

/**
 * Low-level interaction that reads the community name displayed on the loaded
 * settings form and records it in actor notes.
 */
export const ReadCommunitySettings = () =>
	Interaction.where(the`#actor reads the displayed community settings`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await communityPortalPageOf(actor);
		const settingsPage = settingsPageOn(page);
		const displayedName = (await settingsPage.nameInput.inputValue()) ?? '';

		await actor.attemptsTo(notes<CommunityE2ENotes>().set('displayedCommunityName', displayedName));
	});
