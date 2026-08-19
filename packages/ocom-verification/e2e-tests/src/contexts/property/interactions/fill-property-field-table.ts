import type { PropertyAddressSelectFieldKey, PropertyFormTextFieldKey, PropertyListingFlagKey } from '@ocom-verification/verification-shared/pages';
import { type Actor, Interaction, the } from '@serenity-js/core';
import { browserPageOf, propertyFormOn } from '../abilities/admin-portal-page.ts';
import { fillAddressFieldOn } from './select-address-option.ts';

/** Listing flag keys, rendered as antd switches instead of text inputs. */
const LISTING_FLAG_KEYS: ReadonlySet<string> = new Set(['listedForSale', 'listedForRent', 'listedForLease', 'listedInDirectory']);

/** Address keys that tolerate both text inputs and dropdown selects. */
const ADDRESS_SELECT_KEYS: ReadonlySet<string> = new Set(['country', 'countrySubdivision']);

/** Field keys the pre-field-management form already renders. */
const LEGACY_FIELD_KEYS: ReadonlySet<string> = new Set(['propertyName', 'propertyType', 'bedrooms', 'bathrooms', 'squareFeet']);

/**
 * Low-level interaction that fills a flat property field table into the form
 * currently on screen. Before filling, it requires the first not-yet-legacy
 * field of the table to be visible so that a form without the new fields
 * fails fast with a meaningful error instead of timing out per field.
 */
export const FillPropertyFieldTable = (details: Record<string, string>) =>
	Interaction.where(the`#actor fills the property field set`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const formPage = propertyFormOn(browserPageOf(actor));

		const sentinel = Object.keys(details).find((key) => !LEGACY_FIELD_KEYS.has(key));
		if (sentinel) {
			const handle = LISTING_FLAG_KEYS.has(sentinel) ? formPage.listingFlagSwitch(sentinel as PropertyListingFlagKey) : formPage.fieldInput(sentinel as PropertyFormTextFieldKey);
			try {
				await handle.waitFor({ state: 'visible', timeout: 5_000 });
			} catch {
				throw new Error(`The property form does not show the "${sentinel}" field`);
			}
		}

		for (const [key, value] of Object.entries(details)) {
			if (LISTING_FLAG_KEYS.has(key)) {
				await formPage.setListingFlag(key as PropertyListingFlagKey, value === 'true');
			} else if (ADDRESS_SELECT_KEYS.has(key)) {
				await fillAddressFieldOn(formPage, key as PropertyAddressSelectFieldKey, value);
			} else {
				await formPage.fillField(key as PropertyFormTextFieldKey, value);
			}
		}
	});
