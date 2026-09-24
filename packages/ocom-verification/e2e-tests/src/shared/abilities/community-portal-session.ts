import type { BrowserContext, Page } from 'playwright';
import { infrastructure } from '../../infrastructure.ts';
import { performOAuth2Login } from './oauth2-login.ts';

/** Community-portal users supported by the E2E login flow. */
export type CommunityPortalUser = 'owner' | 'member';

interface CommunityPortalCredentials {
	email: string;
	password: string;
}

/**
 * Mock OIDC users defined in `apps/ui-community/mock-oidc.users.json`. The subs
 * of these users match the seeded end users from
 * `@ocom-verification/verification-shared` test data, so the API resolves the
 * matching seeded community membership for each login.
 */
const credentialsByUser: Record<CommunityPortalUser, CommunityPortalCredentials> = {
	owner: { email: 'owner@test.example', password: 'password' },
	member: { email: 'member@test.example', password: 'password' },
};

interface CommunityPortalSession {
	context: BrowserContext;
	page: Page;
	authenticated: boolean;
}

const sessions = new Map<string, CommunityPortalSession>();

/**
 * Return an authenticated community-portal page for the given portal user.
 *
 * Browser contexts are reused across scenarios (one per mock OIDC user), so the
 * OIDC session survives the per-scenario database reseed and only the first
 * scenario per user pays the login cost. The login flow only runs once per
 * session — re-running it would navigate the page away from whatever screen
 * the current step left it on.
 */
export async function communityPortalPageFor(user: CommunityPortalUser): Promise<Page> {
	const credentials = credentialsByUser[user];
	let session = sessions.get(credentials.email);
	if (!session) {
		const context = await infrastructure.newPortalContext('community');
		const page = await context.newPage();
		session = { context, page, authenticated: false };
		sessions.set(credentials.email, session);
	}
	if (!session.authenticated) {
		await performOAuth2Login(session.page, credentials, '/community/accounts');
		session.authenticated = true;
	}
	return session.page;
}

/** Close every community-portal browser context opened by the suite. */
export async function closeCommunityPortalSessions(): Promise<void> {
	for (const session of sessions.values()) {
		await session.context.close().catch(() => undefined);
	}
	sessions.clear();
}
