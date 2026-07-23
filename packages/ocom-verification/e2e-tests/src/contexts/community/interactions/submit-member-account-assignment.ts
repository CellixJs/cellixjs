import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { communityPortalPageOf, memberAccountsPageOn } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

export const SubmitMemberAccountAssignment = (actor: Actor) =>
	Interaction.where(the`#actor submits the member account assignment`, async () => {
		const page = communityPortalPageOf(actor);
		const memberAccountsPage = memberAccountsPageOn(page);
		const accountsListNavigation = page.waitForURL(/\/members\/[^/]+\/accounts\/?$/, { timeout: 15_000 });
		const assignmentError = memberAccountsPage.errorToast.waitFor({ state: 'visible', timeout: 15_000 });
		await memberAccountsPage.clickAddMemberAccount();
		const outcome = await Promise.race([accountsListNavigation.then(() => 'navigated' as const), assignmentError.then(() => 'error' as const)]).catch(() => 'timed-out' as const);
		if (outcome !== 'navigated') {
			const message = (await memberAccountsPage.errorToast.textContent().catch(() => null)) || `Member account assignment did not complete; current URL: ${page.url()}`;
			await actor.attemptsTo(notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		await actor.attemptsTo(notes<MemberE2ENotes>().set('errorMessage', null));
	});
