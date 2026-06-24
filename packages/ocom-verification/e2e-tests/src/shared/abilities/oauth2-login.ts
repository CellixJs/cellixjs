import { TaskStep } from '@cellix/serenity-framework/serenity';
import { BrowseTheWeb } from '@cellix/serenity-framework/serenity/browser';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { Ability, type Activity, type Actor, Task, the } from '@serenity-js/core';
import type { Page } from 'playwright';

/** Credentials used by the E2E OAuth2 login flow. */
export interface OAuth2Credentials {
	/** Email or username submitted to the mock OAuth2 login form. */
	email: string;

	/** Password submitted to the mock OAuth2 login form. */
	password: string;
}

/** Options that configure the E2E OAuth2 login ability. */
export interface OAuth2LoginOptions {
	/** Protected route used to trigger the OIDC redirect flow. */
	protectedPath: string;
}

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
export async function performOAuth2Login(page: Page, credentials: OAuth2Credentials, protectedPath: string): Promise<void> {
	// Navigate to a protected route to trigger the OIDC signinRedirect flow.
	try {
		await page.goto(protectedPath, {
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
		await page.fill('input[name="username"]', credentials.email);
		await page.fill('input[name="password"]', credentials.password);
		await page.click('button[type="submit"]');
	}

	// Wait for the redirect chain to settle on an authenticated page
	await page.waitForURL(isPostAuthUrl, { timeout: 30_000 });
	await page.waitForLoadState('networkidle');
}

/** Serenity ability that authenticates an E2E actor through the OCOM OAuth2 flow. */
export class OAuth2Login extends Ability {
	/**
	 * @param options Route and flow options for the OAuth2 login ability.
	 */
	constructor(private readonly options: OAuth2LoginOptions) {
		super();
	}

	/**
	 * Create an OAuth2 login ability for the supplied protected route.
	 *
	 * @param protectedPath Protected route used to trigger the OIDC redirect flow.
	 */
	static throughProtectedRoute(protectedPath: string): OAuth2Login {
		return new OAuth2Login({ protectedPath });
	}

	/**
	 * Authenticate the actor's current browser page.
	 *
	 * @param actor Actor that has the `BrowseTheWeb` ability.
	 * @param credentials Credentials submitted to the mock OAuth2 form.
	 */
	async authenticate(actor: Actor, credentials: OAuth2Credentials): Promise<void> {
		const { page } = BrowseTheWeb.withActor(actor);
		await performOAuth2Login(page, credentials, this.options.protectedPath);
	}
}

/**
 * Screenplay Task — confirms the actor is authenticated.
 *
 * The browser context is pre-authenticated by {@link performOAuth2Login}
 * during server setup.  This task navigates to a protected route and
 * verifies the page loads without being kicked to the auth provider.
 */
export const LogInWithOAuth2 = (email = actors.CommunityOwner.email, password = 'password') =>
	Task.where(
		the`#actor logs in via OAuth2`,
		new TaskStep('#actor confirms the OAuth2 session is active', async (actor) => {
			await OAuth2Login.as(actor as Actor).authenticate(actor as Actor, { email, password });
		}) as Activity,
	);
