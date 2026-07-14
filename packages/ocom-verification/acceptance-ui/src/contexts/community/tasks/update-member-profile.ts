import { RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { MemberProfilePage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Task } from '@serenity-js/core';
import type { AcceptanceUiMemberProfilePage } from '../../../shared/page-contracts.ts';
import type { MemberProfileFormValues } from '../notes/member-notes.ts';

async function flushPendingReactWork(): Promise<void> {
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export const UpdateMemberProfile = (profile: MemberProfileFormValues): Task =>
	Task.where(
		'#actor updates the member profile',
		new TaskStep<Actor>('#actor edits and saves the member profile', async (actor) => {
			const page: AcceptanceUiMemberProfilePage = new MemberProfilePage(new DomPageAdapter(RenderInDom.as(actor).container));

			await page.clickEditProfile();
			await page.fillDisplayName(profile.name);
			await page.fillEmail(profile.email);
			await page.fillBio(profile.bio);
			await page.setShowInterests(profile.showInterests);
			await page.setShowEmail(profile.showEmail);
			await page.setShowProfile(profile.showProfile);
			await page.setShowLocation(profile.showLocation);
			await page.setShowProperties(profile.showProperties);
			await page.clickSaveProfile();

			await flushPendingReactWork();
		}),
	);
