import { actors } from '@ocom-verification/verification-shared/test-data';
import { type Actor, Interaction, the } from '@serenity-js/core';
import type { Page } from 'playwright';
import { BrowseTheWeb } from '../abilities/browse-the-web.ts';

/**
 * URL predicate that resolves once the OIDC redirect chain has settled —
 * i.e. we are no longer on the mock-auth hostname or the /auth-redirect
 * callback path.
 */
const isPostAuthUrl = (url: URL) => !url.hostname.includes('mock-auth') && !url.pathname.includes('auth-redirect');

/**
 * Authenticates the browser session via the OIDC auto-redirect flow.
 *
 * The app uses RequireAuth + react-oidc-context.  When an unauthenticated
 * user hits a protected route, RequireAuth calls `signinRedirect()` which
 * navigates to the mock OAuth2 server's `/authorize` endpoint.  The mock
 * server redirects to `/login` (since userStore is configured).  This
 * function fills in the test user credentials and submits the form.
 */
export async function performOAuth2Login(page: Page): Promise<void> {
	// Navigate to a protected route to trigger the OIDC signinRedirect flow.
	try {
		await page.goto('/community/accounts', {
			waitUntil: 'networkidle',
			timeout: 60_000,
		});
	} catch {
		// Navigation may be interrupted by OIDC redirect — this is expected
	}

	// Wait for redirects to settle on either the login page or the app
	await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => undefined);

	// If the mock OAuth2 login form is shown, fill credentials and submit.
	// CommunityOwner is defined in mock-oidc.users.json with password "password".
	if (page.url().includes('/login')) {
		await page.fill('input[name="username"]', actors.CommunityOwner.email);
		await page.fill('input[name="password"]', 'password');
		await page.click('button[type="submit"]');
	}

	// Wait for the redirect chain to settle on an authenticated page
	await page.waitForURL(isPostAuthUrl, { timeout: 30_000 });
	await page.waitForLoadState('networkidle');
}

/**
 * Screenplay Interaction — confirms the actor is authenticated.
 *
 * The browser context is pre-authenticated by {@link performOAuth2Login}
 * during server setup.  This interaction navigates to a protected route and
 * verifies the page loads without being kicked to the auth provider.
 */
export const OAuth2Login = (_email?: string, _password?: string) =>
	Interaction.where(the`#actor logs in via OAuth2`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const { page } = BrowseTheWeb.withActor(actor);

		// Session tokens live in sessionStorage from pre-auth.
		try {
			await page.goto('/community/accounts', {
				waitUntil: 'networkidle',
				timeout: 30_000,
			});
		} catch {
			// Navigation may be interrupted by OIDC redirect on first access
		}

		if (page.url().includes('/login')) {
			await page.fill('input[name="username"]', actors.CommunityOwner.email);
			await page.fill('input[name="password"]', 'password');
			await page.click('button[type="submit"]');
		}

		await page.waitForURL(isPostAuthUrl, { timeout: 30_000 });
	});
