import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { ADMIN_BASE_PATH_PATTERN, browserPageOf, waitUntil } from '../abilities/admin-portal-page.ts';
import type { PropertyE2ENotes } from '../notes/property-notes.ts';

/**
 * Low-level interaction that opens the admin portal of the given community
 * from the accounts list and records its base path in actor notes.
 *
 * The admin member is provisioned asynchronously after community creation,
 * so the accounts page is reloaded until the Admin Portals dropdown offers a
 * member to click.
 */
export const OpenAdminPortal = (communityName: string) =>
	Interaction.where(the`#actor opens the admin portal of "${communityName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = browserPageOf(actor);

		const deadline = Date.now() + 60_000;
		let navigated = false;
		while (!navigated && Date.now() < deadline) {
			await page.goto('/community/accounts', { waitUntil: 'networkidle' });

			const row = page.getByRole('row').filter({ hasText: communityName }).first();
			const adminPortalsButton = row.getByRole('button', { name: /Admin Portals/i });
			if (!(await adminPortalsButton.isVisible().catch(() => false))) {
				await page.waitForTimeout(500);
				continue;
			}

			await adminPortalsButton.hover();

			// The dropdown menu portals to document.body; the admin member button
			// only appears once member provisioning has completed.
			const memberButton = page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').getByRole('button').first();
			const memberVisible = await memberButton
				.waitFor({ state: 'visible', timeout: 3_000 })
				.then(() => true)
				.catch(() => false);
			if (!memberVisible) {
				await page.waitForTimeout(500);
				continue;
			}

			await memberButton.click();
			navigated = await page
				.waitForURL((url) => ADMIN_BASE_PATH_PATTERN.test(url.pathname), { timeout: 10_000 })
				.then(() => true)
				.catch(() => false);
		}

		if (!navigated) {
			throw new Error(`Timed out waiting for the admin portal of "${communityName}" to become available`);
		}

		await waitUntil(async () => ADMIN_BASE_PATH_PATTERN.test(new URL(page.url()).pathname), 'Timed out waiting for the admin portal URL to settle');
		const adminBasePathMatch = new URL(page.url()).pathname.match(ADMIN_BASE_PATH_PATTERN);
		if (!adminBasePathMatch) {
			throw new Error(`Expected an admin portal URL but got "${page.url()}"`);
		}

		await actor.attemptsTo(notes<PropertyE2ENotes>().set('adminBasePath', adminBasePathMatch[0]));
	});
