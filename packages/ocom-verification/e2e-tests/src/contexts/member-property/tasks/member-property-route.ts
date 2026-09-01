import { type Actor, Interaction, notes, Task, the } from '@serenity-js/core';
import { memberPropertiesListOn, memberPropertyFormOn, memberPropertyPortalPageOf, memberPropertyRouteDiagnostic } from '../abilities/member-property-portal-page.ts';
import { OpenMemberPropertyDetail } from '../interactions/open-member-property-detail.ts';
import { OpenMemberPropertyDirectory } from '../interactions/open-member-property-directory.ts';
import { RecordMemberPropertyId } from '../interactions/record-member-property-id.ts';
import type { MemberPropertyE2ENotes } from '../notes/member-property-notes.ts';

const responseErrorMessage = (payload: unknown): string => {
	if (!payload || typeof payload !== 'object') {
		return 'The GraphQL response had no mutation payload';
	}
	const errors = (payload as { errors?: unknown }).errors;
	if (Array.isArray(errors) && errors.length > 0) {
		return errors.map((error) => (error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error))).join(', ');
	}
	return 'The Property mutation did not report success';
};

const waitForSuccessfulMemberPropertyMutation = async (page: Awaited<ReturnType<typeof memberPropertyPortalPageOf>>, operationName: string, resultField: 'propertyCreate' | 'propertyUpdate'): Promise<void> => {
	const response = await page.waitForResponse((candidate) => candidate.url().includes('/api/graphql') && candidate.request().method() === 'POST' && candidate.request().postData()?.includes(operationName) === true, {
		timeout: 5_000,
	});
	if (!response.ok()) {
		throw new Error(`The ${operationName} request failed with HTTP ${response.status()}`);
	}
	const payload = (await response.json()) as unknown;
	const results = Array.isArray(payload) ? payload : [payload];
	const mutationResult = results.find((result): result is { data?: Record<string, { status?: { success?: boolean; errorMessage?: string | null } }> } =>
		Boolean(result && typeof result === 'object' && 'data' in result && (result as { data?: Record<string, unknown> }).data?.[resultField]),
	);
	const status = mutationResult?.data?.[resultField]?.status;
	if (!status?.success) {
		throw new Error(status?.errorMessage ?? responseErrorMessage(results.find((result) => result && typeof result === 'object' && 'errors' in result)));
	}
};

async function requireDirectory(actor: Actor): Promise<void> {
	const page = await memberPropertyPortalPageOf(actor);
	const list = memberPropertiesListOn(page);
	const rendered = await list.heading
		.waitFor({ state: 'visible', timeout: 5_000 })
		.then(() => true)
		.catch(() => false);
	if (!rendered) {
		throw new Error(`The member Property directory is not implemented: ${await memberPropertyRouteDiagnostic(page)}`);
	}
}

/** Opens the real route without hiding its Phase 1 missing-feature red baseline. */
export const ViewMemberPropertyDirectory = () => Task.where(the`#actor views the member Property directory`, OpenMemberPropertyDirectory());

export const CreateMemberPropertyViaForm = (propertyName: string) =>
	Task.where(
		the`#actor creates the member Property "${propertyName}"`,
		notes<MemberPropertyE2ENotes>().set('lastOperationStatus', undefined),
		notes<MemberPropertyE2ENotes>().set('lastOperationError', undefined),
		OpenMemberPropertyDirectory(),
		Interaction.where(the`#actor submits the member Property create form`, async (serenityActor) => {
			const actor = serenityActor as unknown as Actor;
			try {
				await requireDirectory(actor);
				const page = await memberPropertyPortalPageOf(actor);
				await memberPropertiesListOn(page).clickAddProperty();
				const form = memberPropertyFormOn(page);
				await form.propertyNameInput.waitFor({ state: 'visible', timeout: 5_000 });
				await form.fillPropertyName(propertyName);
				const creation = waitForSuccessfulMemberPropertyMutation(page, 'MemberPropertyCreate', 'propertyCreate');
				await form.clickCreate();
				await creation;
				await actor.attemptsTo(RecordMemberPropertyId(propertyName));
				await actor.attemptsTo(notes<MemberPropertyE2ENotes>().set('lastOperationStatus', 'SUCCESS'));
			} catch (error) {
				await actor.attemptsTo(notes<MemberPropertyE2ENotes>().set('lastOperationStatus', 'FAILURE'), notes<MemberPropertyE2ENotes>().set('lastOperationError', error instanceof Error ? error.message : String(error)));
			}
		}),
	);

export const UpdateMemberPropertyListingFlagViaForm = (propertyName: string, value: boolean) =>
	Task.where(
		the`#actor updates the member Property "${propertyName}"`,
		notes<MemberPropertyE2ENotes>().set('lastOperationStatus', undefined),
		notes<MemberPropertyE2ENotes>().set('lastOperationError', undefined),
		OpenMemberPropertyDetail(propertyName),
		Interaction.where(the`#actor saves the member-editable listing flag`, async (serenityActor) => {
			const actor = serenityActor as unknown as Actor;
			try {
				const page = await memberPropertyPortalPageOf(actor);
				const form = memberPropertyFormOn(page);
				await form.setListingFlag('listedInDirectory', value);
				const update = waitForSuccessfulMemberPropertyMutation(page, 'MemberPropertyUpdate', 'propertyUpdate');
				await form.clickSave();
				await update;
				await actor.attemptsTo(notes<MemberPropertyE2ENotes>().set('lastOperationStatus', 'SUCCESS'));
			} catch (error) {
				await actor.attemptsTo(notes<MemberPropertyE2ENotes>().set('lastOperationStatus', 'FAILURE'), notes<MemberPropertyE2ENotes>().set('lastOperationError', error instanceof Error ? error.message : String(error)));
			}
		}),
	);
