import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { PropertiesListPage, PropertyFormPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, type AnswersQuestions, notes, type UsesAbilities } from '@serenity-js/core';
import type { Page } from 'playwright';
import type { PropertyE2ENotes } from '../notes/property-notes.ts';

/** URL pattern of an admin portal route (`/community/:communityId/admin/:memberId`). */
export const ADMIN_BASE_PATH_PATTERN = /\/community\/[a-f0-9]{24}\/admin\/[a-f0-9]{24}/i;

/** URL pattern of a property detail route within the admin portal. */
export const PROPERTY_DETAIL_PATH_PATTERN = /\/properties\/[a-f0-9]{24}$/i;

/** Poll a browser condition until it holds or the timeout elapses. */
export const waitUntil = async (condition: () => Promise<boolean>, failureMessage: string | (() => Promise<string>), timeoutMs = 20_000): Promise<void> => {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (await condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(typeof failureMessage === 'string' ? failureMessage : await failureMessage());
};

/** The actor's browser page. */
export const browserPageOf = (actor: AnswersQuestions & UsesAbilities): Page => BrowseTheWeb.withActor(actor as unknown as Actor).page;

/** Properties list page object bound to the given browser page. */
export const propertiesListOn = (page: Page): PropertiesListPage => new PropertiesListPage(new PlaywrightPageAdapter(page));

/** Property form page object bound to the given browser page. */
export const propertyFormOn = (page: Page): PropertyFormPage => new PropertyFormPage(new PlaywrightPageAdapter(page));

/** Admin portal base path of the managed community, recorded in actor notes. */
export const adminBasePathOf = async (actor: AnswersQuestions): Promise<string> => {
	try {
		const adminBasePath = await actor.answer(notes<PropertyE2ENotes>().get('adminBasePath'));
		if (adminBasePath) {
			return adminBasePath;
		}
	} catch {
		// Fall through to the descriptive error below.
	}
	throw new Error('No admin portal base path was recorded. Did the property manager Given step run?');
};

/** Navigate to the admin properties list and wait for it to render. */
export const openPropertiesListOn = async (page: Page, adminBasePath: string): Promise<PropertiesListPage> => {
	await page.goto(`${adminBasePath}/properties`, { waitUntil: 'networkidle' });
	const listPage = propertiesListOn(page);
	await waitUntil(
		() => listPage.heading.isVisible(),
		async () =>
			`Timed out waiting for the properties list to render; url=${page.url()}; body=${(
				await page
					.locator('body')
					.textContent()
					.catch(() => null)
			)?.slice(0, 600)}`,
		30_000,
	);
	return listPage;
};

/** Open the detail form of a property from the list and wait for it to load. */
export const openPropertyDetailOn = async (page: Page, adminBasePath: string, propertyName: string): Promise<PropertyFormPage> => {
	const listPage = await openPropertiesListOn(page, adminBasePath);
	await waitUntil(() => listPage.hasPropertyNamed(propertyName), `Timed out waiting for the properties list to include "${propertyName}"`);
	await listPage.clickViewForProperty(propertyName);
	await page.waitForURL((url) => PROPERTY_DETAIL_PATH_PATTERN.test(url.pathname), { timeout: 20_000 });
	const formPage = propertyFormOn(page);
	await waitUntil(async () => (await formPage.propertyNameValue()) === propertyName, `Timed out waiting for the detail form of property "${propertyName}" to load`);
	return formPage;
};

// Property ids observed during the current scenario, keyed by property name.
const scenarioPropertyIds = new Map<string, string>();

/** Forgets the property ids recorded for the previous scenario. */
export function clearScenarioPropertyIds(): void {
	scenarioPropertyIds.clear();
}

/** Records the backend id of a property created or renamed in this scenario. */
export function recordPropertyId(propertyName: string, propertyId: string): void {
	scenarioPropertyIds.set(propertyName, propertyId);
}

/** The backend id recorded for a property in this scenario, if known. */
export function propertyIdFor(propertyName: string): string | undefined {
	return scenarioPropertyIds.get(propertyName);
}
