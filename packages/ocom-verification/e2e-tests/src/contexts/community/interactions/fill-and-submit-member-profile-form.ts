import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { communityPortalPageOf, memberProfilePageOn } from '../abilities/community-portal-page.ts';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

export const SubmitMemberProfileForm = (actor: Actor) =>
	Interaction.where(the`#actor submits the member profile form`, async () => {
		const page = communityPortalPageOf(actor);
		const memberProfilePage = memberProfilePageOn(page);

		await memberProfilePage.clickSaveProfile();
		await memberProfilePage.firstValidationError.waitFor({ state: 'visible', timeout: 750 }).catch(() => undefined);
		if (await memberProfilePage.firstValidationError.isVisible().catch(() => false)) {
			const errorText = await memberProfilePage.firstValidationError.textContent();
			await actor.attemptsTo(notes<MemberE2ENotes>().set('errorMessage', errorText || 'Validation error'));
			return;
		}

		const didSave = await Promise.race([
			memberProfilePage.editProfileButton.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true),
			memberProfilePage.errorToast.waitFor({ state: 'visible', timeout: 15_000 }).then(() => false),
		]);
		if (!didSave) {
			const message = (await memberProfilePage.errorToast.textContent()) || 'Member profile update failed';
			await actor.attemptsTo(notes<MemberE2ENotes>().set('errorMessage', message));
			throw new Error(message);
		}

		await actor.attemptsTo(notes<MemberE2ENotes>().set('errorMessage', null));
	});
