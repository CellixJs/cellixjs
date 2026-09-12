import { type Actor, Interaction, the } from '@serenity-js/core';
import { browserPageOf, propertyFormOn, waitUntil } from '../abilities/admin-portal-page.ts';

/**
 * Low-level interaction that assigns the property owner through the Owner
 * member select on the form currently on screen. Fails fast when the form
 * does not render an Owner select yet.
 */
export const SelectPropertyOwner = (memberName: string) =>
	Interaction.where(the`#actor selects the owner "${memberName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const formPage = propertyFormOn(browserPageOf(actor));

		try {
			await formPage.ownerSelectInput.waitFor({ state: 'visible', timeout: 5_000 });
		} catch {
			throw new Error('The property form does not show an "Owner" select');
		}
		await formPage.openOwnerSelect();
		await waitUntil(() => formPage.ownerOptionNamed(memberName).isVisible(), `Expected the Owner select to offer the member "${memberName}"`, 10_000);
		await formPage.clickOwnerOption(memberName);
	});
