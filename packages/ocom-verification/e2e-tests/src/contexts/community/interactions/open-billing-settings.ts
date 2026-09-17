import { Interaction, the } from '@serenity-js/core';
import { openBillingSettings } from '../abilities/community-portal-page.ts';

export const OpenBillingSettings = () =>
	Interaction.where(the`#actor opens community billing settings`, async (actor) => {
		await openBillingSettings(actor);
	});
