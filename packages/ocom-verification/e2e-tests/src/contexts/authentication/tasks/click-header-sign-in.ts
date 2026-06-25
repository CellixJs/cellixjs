import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { HomePage } from '@ocom-verification/verification-shared/pages';
import { type Activity, type Actor, notes, Task } from '@serenity-js/core';
import type { Page } from 'playwright';
import type { E2EHomePage } from '../../../shared/page-contracts.ts';
import type { HeaderE2ENotes, HeaderE2ESite } from '../notes/header-notes.ts';

const portalCredentials: Record<HeaderE2ESite, { username: string; password: string }> = {
	community: { username: 'test@example.com', password: 'password' },
	staff: { username: 'staff@ownercommunity.onmicrosoft.com', password: 'password' },
};

const isPostAuthUrl = (url: URL) => !url.hostname.includes('mock-auth') && !url.pathname.includes('auth-redirect');

export const ClickHeaderSignIn = (page: Page, site: HeaderE2ESite, identityProviderUnreachable: boolean) =>
	Task.where(
		'#actor clicks the sign-in button on the home page',
		new TaskStep('#actor clicks the sign-in button on the home page', async (serenityActor) => {
			const actor = serenityActor as Actor;

			await page.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });

			const adapter = new PlaywrightPageAdapter(page);
			const homePage: E2EHomePage = new HomePage(adapter);
			await homePage.clickSignIn();

			if (identityProviderUnreachable) {
				await page.waitForTimeout(2_000);
				await actor.attemptsTo(notes<HeaderE2ENotes>().set('fallbackTriggered', true), notes<HeaderE2ENotes>().set('signinRedirectInvoked', false), notes<HeaderE2ENotes>().set('postLoginUrl', page.url()));
				return;
			}

			await page.waitForURL((url) => url.hostname.includes('mock-auth'), { timeout: 15_000 });

			const creds = portalCredentials[site];
			if (page.url().includes('/login')) {
				await page.fill('input[name="username"]', creds.username);
				await page.fill('input[name="password"]', creds.password);
				await page.click('button[type="submit"]');
			}

			await page.waitForURL(isPostAuthUrl, { timeout: 30_000 });
			await page.waitForLoadState('networkidle');
			await actor.attemptsTo(notes<HeaderE2ENotes>().set('signinRedirectInvoked', true), notes<HeaderE2ENotes>().set('fallbackTriggered', false), notes<HeaderE2ENotes>().set('postLoginUrl', page.url()));
		}) as Activity,
	);
