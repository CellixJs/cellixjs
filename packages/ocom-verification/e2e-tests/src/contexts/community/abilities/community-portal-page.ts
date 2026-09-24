import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { CommunitySettingsPage } from '@ocom-verification/verification-shared/pages';
import { COMMUNITY_IDS, MEMBER_IDS } from '@ocom-verification/verification-shared/test-data';
import { type AnswersQuestions, notes } from '@serenity-js/core';
import type { Page } from 'playwright';
import { type CommunityPortalUser, communityPortalPageFor } from '../../../shared/abilities/community-portal-session.ts';
import type { E2ECommunitySettingsPage } from '../../../shared/page-contracts.ts';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';

/** Poll a browser condition until it holds or the timeout elapses. */
const waitUntil = async (condition: () => Promise<boolean>, failureMessage: string, timeoutMs = 20_000): Promise<void> => {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (await condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(failureMessage);
};

/** Resolve the authenticated community-portal page for the actor's portal user. */
export const communityPortalPageOf = async (actor: AnswersQuestions): Promise<Page> => {
	let user: CommunityPortalUser = 'owner';
	try {
		user = (await actor.answer(notes<CommunityE2ENotes>().get('portalUser'))) ?? 'owner';
	} catch {
		// No portal user noted yet; fall back to the community owner.
	}
	return await communityPortalPageFor(user);
};

/** Resolve the admin settings route for the actor's noted membership. */
export const communitySettingsPathOf = async (actor: AnswersQuestions): Promise<string> => {
	let memberId: string | undefined;
	try {
		memberId = await actor.answer(notes<CommunityE2ENotes>().get('memberId'));
	} catch {
		// No member noted yet; fall back to the seeded admin member.
	}
	return `/community/${COMMUNITY_IDS.seededCommunity}/admin/${memberId || MEMBER_IDS.seededAdminMember}/settings`;
};

/** Community settings page object bound to the given browser page. */
export const settingsPageOn = (page: Page): E2ECommunitySettingsPage => new CommunitySettingsPage(new PlaywrightPageAdapter(page));

/** Navigate to the community admin settings screen and wait for the form to load. */
export const openCommunitySettings = async (page: Page, path: string): Promise<E2ECommunitySettingsPage> => {
	await page.goto(path, { waitUntil: 'networkidle' });
	const settingsPage = settingsPageOn(page);
	await waitUntil(async () => Boolean(await settingsPage.nameInput.inputValue()), 'Timed out waiting for the community settings form to load');
	return settingsPage;
};
