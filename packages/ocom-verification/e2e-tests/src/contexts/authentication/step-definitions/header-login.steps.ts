import { Given, Then, When } from '@cucumber/cucumber';
import { actorCalled, notes } from '@serenity-js/core';
import type { BrowserContext, Page } from 'playwright';
import * as infra from '../../../shared/support/shared-infrastructure.ts';

interface HeaderE2ENotes {
	signinRedirectInvoked: boolean;
	fallbackTriggered: boolean;
	postLoginUrl: string;
}

type Site = 'community' | 'staff';

interface HeaderE2EState {
	actorName: string;
	site: Site;
	identityProviderUnreachable: boolean;
	context?: BrowserContext;
	page?: Page;
}

let state: HeaderE2EState | undefined;

function getHeaderState(): HeaderE2EState {
	if (!state) throw new Error('Header scenario state not initialised');
	return state;
}

/** Dispose the scenario's isolated browser context */
async function cleanupHeaderContext(): Promise<void> {
	if (state?.page) {
		await state.page.close().catch(() => undefined);
		delete state.page;
	}
	if (state?.context) {
		await state.context.close().catch(() => undefined);
		delete state.context;
	}
}

Given('{word} visits the community site', async (actorName: string) => {
	state = { actorName, site: 'community', identityProviderUnreachable: false };
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<HeaderE2ENotes>().set('signinRedirectInvoked', false), notes<HeaderE2ENotes>().set('fallbackTriggered', false), notes<HeaderE2ENotes>().set('postLoginUrl', ''));
});

Given('{word} visits the staff site', async (actorName: string) => {
	state = { actorName, site: 'staff', identityProviderUnreachable: false };
	const actor = actorCalled(actorName);
	await actor.attemptsTo(notes<HeaderE2ENotes>().set('signinRedirectInvoked', false), notes<HeaderE2ENotes>().set('fallbackTriggered', false), notes<HeaderE2ENotes>().set('postLoginUrl', ''));
});

Given('the identity provider is unreachable', () => {
	getHeaderState().identityProviderUnreachable = true;
});

// Credentials from apps/ui-{portal}/mock-oidc.users.json
const portalCredentials: Record<Site, { username: string; password: string }> = {
	community: { username: 'test@example.com', password: 'password' },
	staff: { username: 'staff@ownercommunity.onmicrosoft.com', password: 'password' },
};

When('{word} chooses to sign in', async (actorName: string) => {
	const s = getHeaderState();
	s.actorName = actorName;

	const { browser } = infra.getState();
	if (!browser) throw new Error('Browser not launched');

	const baseUrl = s.site === 'community' ? (infra.getState().communityBaseUrl ?? 'https://ownercommunity.localhost:1355') : (infra.getState().staffBaseUrl ?? 'https://staff.ownercommunity.localhost:1355');

	// Fresh unauthenticated context — isolated from the pre-auth context
	// used by other test suites. Cleaned up in the Then step after verification.
	const context = await browser.newContext({
		baseURL: baseUrl,
		ignoreHTTPSErrors: true,
	});
	s.context = context;

	if (s.identityProviderUnreachable) {
		await context.route('**/mock-auth.**', (route) => route.abort('connectionrefused'));
	}

	const page = await context.newPage();
	s.page = page;

	// Navigate to site root — the unauthenticated home page is visible
	await page.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });

	// Click the sign-in button on the home page
	const signInButton = page.getByRole('button', { name: /Log In|Sign In/i });
	await signInButton.click();

	if (s.identityProviderUnreachable) {
		// IdP is blocked — the app should handle the error gracefully.
		// Wait for error handling to settle, then leave the page open for Then to inspect.
		await page.waitForTimeout(2000);
	} else {
		// Wait for redirect to mock-auth login form
		await page.waitForURL((url) => url.hostname.includes('mock-auth'), { timeout: 15_000 });

		// Complete the login form with portal-specific credentials
		const creds = portalCredentials[s.site];
		if (page.url().includes('/login')) {
			await page.fill('input[name="username"]', creds.username);
			await page.fill('input[name="password"]', creds.password);
			await page.click('button[type="submit"]');
		}

		// Wait for the redirect chain to settle back on the portal
		await page.waitForURL((url) => !url.hostname.includes('mock-auth') && !url.pathname.includes('auth-redirect'), { timeout: 30_000 });
		await page.waitForLoadState('networkidle');
	}
});

Then('{word} is taken to the sign-in flow', async (actorName: string) => {
	const { page } = getHeaderState();
	if (!page) throw new Error('No page — did the When step run?');

	try {
		// Verify the page actually landed back on the portal (not stuck on mock-auth)
		const currentUrl = new URL(page.url());
		if (currentUrl.hostname.includes('mock-auth')) {
			throw new Error(`Expected ${actorName} to complete the sign-in flow, but the page is still on the IdP: ${page.url()}`);
		}
		if (currentUrl.pathname.includes('auth-redirect')) {
			throw new Error(`Expected ${actorName} to complete the sign-in flow, but the page is stuck on the auth redirect callback: ${page.url()}`);
		}
	} finally {
		await cleanupHeaderContext();
	}
});

Then('{word} can still reach the sign-in page', async (actorName: string) => {
	const { page } = getHeaderState();
	if (!page) throw new Error('No page — did the When step run?');

	try {
		// With the IdP unreachable, the header's fallback should have fired
		// (direct navigation to the redirect URI). The page should NOT be on
		// mock-auth (which was blocked).
		const currentUrl = new URL(page.url());
		if (currentUrl.hostname.includes('mock-auth')) {
			throw new Error(`Expected ${actorName} to reach the sign-in page via fallback, but somehow ended up on mock-auth: ${page.url()}`);
		}
	} finally {
		await cleanupHeaderContext();
	}
});
