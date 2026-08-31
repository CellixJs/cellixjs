import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { communityPortalPageOf, memberCreatePageOn } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

export const SubmitMemberCreateForm = (actor: Actor, memberName: string) =>
	Interaction.where(the`#actor submits the member create form for "${memberName}"`, async () => {
		const page = communityPortalPageOf(actor);
		const memberCreatePage = memberCreatePageOn(page);
		await memberCreatePage.clickCreateMember();

		await memberCreatePage.validationError.waitFor({ state: 'visible', timeout: 750 }).catch(() => undefined);
		if (await memberCreatePage.validationError.isVisible().catch(() => false)) {
			const errorText = await memberCreatePage.validationError.textContent();
			await actor.attemptsTo(notes<MemberE2ENotes>().set('lastMemberId', null), notes<MemberE2ENotes>().set('errorMessage', errorText || 'Validation error'));
			return;
		}

		await page.waitForURL(/\/members\/[^/]+$/, { timeout: 15_000 }).catch(async () => {
			await memberCreatePage.errorToast.waitFor({ state: 'visible', timeout: 1_000 }).catch(() => undefined);
			const message = (await memberCreatePage.errorToast.textContent().catch(() => null)) || `Member creation did not navigate to a member detail page for "${memberName}"`;
			await actor.attemptsTo(notes<MemberE2ENotes>().set('lastMemberId', null), notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		});

		const memberId = new URL(page.url()).pathname.match(/\/members\/([^/]+)$/)?.[1];
		if (!memberId) {
			throw new Error(`Member creation navigated to an unexpected URL: ${page.url()}`);
		}

		await actor.attemptsTo(notes<MemberE2ENotes>().set('lastMemberId', decodeURIComponent(memberId)), notes<MemberE2ENotes>().set('errorMessage', null));
	});
