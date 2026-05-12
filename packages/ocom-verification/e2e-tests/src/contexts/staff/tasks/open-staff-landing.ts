import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { BrowseTheWeb } from '../../../shared/abilities/browse-the-web.ts';
import { getState } from '../../../shared/support/shared-infrastructure.ts';
import type { StaffE2ENotes } from '../abilities/staff-types.ts';

export const OpenStaffLanding = () =>
	Interaction.where(the`#actor opens staff landing`, async (actor) => {
		const fullActor = actor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(fullActor);
		const { staffBrowserBaseUrl } = getState();

		if (!staffBrowserBaseUrl) {
			throw new Error('Staff UI base URL is not available');
		}

		try {
			await page.goto(`${staffBrowserBaseUrl}/staff`, {
				waitUntil: 'networkidle',
				timeout: 60_000,
			});
		} catch {
			// OIDC redirect can interrupt navigation in the first auth round-trip.
		}

		await page.waitForURL(
			(url) => {
				if (url.hostname.includes('mock-auth')) return false;
				return url.hostname.includes('staff.ownercommunity.localhost');
			},
			{ timeout: 30_000 },
		);

		const currentPath = new URL(page.url()).pathname;
		await fullActor.attemptsTo(notes<StaffE2ENotes>().set('currentPath', currentPath));
	});
