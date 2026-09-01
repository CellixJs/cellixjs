import { findMemberPropertyFixtureRecord } from '@ocom-verification/verification-shared/test-data';
import { type Actor, notes, Question } from '@serenity-js/core';
import { mongoConnectionString, mongoDbName } from '../../../servers/test-mongo-server.ts';
import { adminBasePathOfMemberProperty, memberBasePathOf, memberPropertiesListOn, memberPropertyPortalPageOf, memberPropertyReadOnlyDetailOn, memberPropertyRouteDiagnostic } from '../abilities/member-property-portal-page.ts';
import type { MemberPropertyE2ENotes } from '../notes/member-property-notes.ts';

async function memberDirectoryIsRendered(actor: Actor): Promise<boolean> {
	const page = await memberPropertyPortalPageOf(actor);
	return await memberPropertiesListOn(page).heading.isVisible();
}

/** Waits for a member directory row to appear, retaining route diagnostics on failure. */
export const MemberPropertyDirectoryIncludes = (propertyName: string) =>
	Question.about(`whether the member Property directory includes "${propertyName}"`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await memberPropertyPortalPageOf(actor);
		const list = memberPropertiesListOn(page);
		const rendered = await list.heading
			.waitFor({ state: 'visible', timeout: 5_000 })
			.then(() => true)
			.catch(() => false);
		if (!rendered) {
			throw new Error(`Expected the member Property directory to render: ${await memberPropertyRouteDiagnostic(page)}`);
		}
		const exists = await list.hasPropertyNamed(propertyName);
		if (!exists) {
			throw new Error(`Expected the member Property directory to include "${propertyName}", but it listed: ${(await list.listedPropertyNames()).join(', ')}`);
		}
		return true;
	});

/** Reports the form interaction result captured by the member route task. */
export const MemberPropertyOperationSucceeds = () =>
	Question.about('whether the member Property operation succeeds', async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const status = await actor.answer(notes<MemberPropertyE2ENotes>().get('lastOperationStatus'));
		if (status !== 'SUCCESS') {
			const error = await actor.answer(notes<MemberPropertyE2ENotes>().get('lastOperationError'));
			throw new Error(`Expected the member Property operation to succeed, but status was "${status ?? 'not recorded'}"${error ? `: ${error}` : ''}`);
		}
		return true;
	});

/** Checks the allowed persisted listing-content mutation. */
export const MemberPropertyListingFlagEquals = (propertyName: string, flagName: string, expectedValue: string) =>
	Question.about(`whether "${propertyName}" has ${flagName}=${expectedValue}`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const communityId = await actor.answer(notes<MemberPropertyE2ENotes>().get('communityId'));
		const property = await findMemberPropertyFixtureRecord({ connectionString: mongoConnectionString(), dbName: mongoDbName }, communityId, propertyName);
		if (!property) {
			throw new Error(`Expected "${propertyName}" to exist while checking its ${flagName}`);
		}
		if (flagName !== 'listedInDirectory') {
			throw new Error(`Unsupported member Property listing flag assertion "${flagName}"`);
		}
		const expected = expectedValue === 'true';
		if (property.listedInDirectory !== expected) {
			throw new Error(`Expected "${propertyName}" ${flagName} to be ${expected}, but it was ${property.listedInDirectory}`);
		}
		return true;
	});

/** A foreign detail must provide information without exposing edit inputs or owner identity. */
export const MemberPropertyDetailIsReadOnly = () =>
	Question.about('whether the member Property detail is read-only', async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await memberPropertyPortalPageOf(actor);
		const detail = memberPropertyReadOnlyDetailOn(page);
		const rendered = await detail.heading
			.waitFor({ state: 'visible', timeout: 5_000 })
			.then(() => true)
			.catch(() => false);
		if (!rendered) {
			throw new Error(`Expected a read-only member Property detail to render: ${await memberPropertyRouteDiagnostic(page)}`);
		}
		if (await detail.hasEditableControls()) {
			throw new Error('Expected the foreign member Property detail to be read-only, but editable controls were visible');
		}
		return true;
	});

export const MemberPropertyDetailHidesForeignOwnerIdentity = () =>
	Question.about('whether the foreign owner identity is hidden', async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await memberPropertyPortalPageOf(actor);
		if (await memberPropertyReadOnlyDetailOn(page).displaysOwnerIdentity('Other Owner')) {
			throw new Error('Expected the foreign owner identity to be hidden from the member Property detail');
		}
		return true;
	});

/** Verifies that an ineligible visitor did not obtain the directory view. */
export const MemberPropertyRouteIsDenied = () =>
	Question.about('whether the member Property route is denied', async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await memberPropertyPortalPageOf(actor);
		if (await memberDirectoryIsRendered(actor)) {
			throw new Error(`Expected the member Property route to be denied, but the directory rendered: ${await memberPropertyRouteDiagnostic(page)}`);
		}
		const pathname = new URL(page.url()).pathname;
		if (!pathname.startsWith(await memberBasePathOf(actor))) {
			return true;
		}
		const denied = await page
			.getByText(/access denied|forbidden|not authorized|not found/i)
			.isVisible()
			.catch(() => false);
		if (!denied) {
			throw new Error(`Expected the member Property route to render an explicit denial or redirect away from the member subtree: ${await memberPropertyRouteDiagnostic(page)}`);
		}
		return true;
	});

/** Verifies manager routing lands at the established admin Properties directory. */
export const IsRedirectedToAdminPropertyDirectory = () =>
	Question.about('whether the visitor was redirected to the admin Property directory', async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await memberPropertyPortalPageOf(actor);
		const expectedPath = `${await adminBasePathOfMemberProperty(actor)}/properties`;
		const redirected =
			new URL(page.url()).pathname === expectedPath ||
			(await page
				.waitForURL((url) => url.pathname === expectedPath, { timeout: 5_000 })
				.then(() => true)
				.catch(() => false));
		if (!redirected) {
			const pathname = new URL(page.url()).pathname;
			throw new Error(`Expected a manager member-Property URL to redirect to "${expectedPath}", but got "${pathname}": ${await memberPropertyRouteDiagnostic(page)}`);
		}
		return true;
	});
