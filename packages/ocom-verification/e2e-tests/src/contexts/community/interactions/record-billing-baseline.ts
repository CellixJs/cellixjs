import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { billingPageOn, communityBrowserPageOf } from '../abilities/community-portal-page.ts';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';

export const RecordBillingBaseline = () =>
	Interaction.where(the`#actor records the billing history baseline`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const history = await billingPageOn(communityBrowserPageOf(actor)).historyText();
		await actor.attemptsTo(notes<CommunityE2ENotes>().set('baselineTransactionCount', history ? history.split('\n').filter(Boolean).length : 0));
	});
