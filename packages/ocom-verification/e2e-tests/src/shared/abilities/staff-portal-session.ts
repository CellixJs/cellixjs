import type { BrowserContext, Page } from 'playwright';
import { infrastructure } from '../../infrastructure.ts';
import { performOAuth2Login } from './oauth2-login.ts';

/** Business roles supported by the staff portal E2E login flow. */
export type StaffPortalBusinessRole = 'finance' | 'tech admin' | 'service line owner' | 'case manager';

interface StaffPortalCredentials {
	email: string;
	password: string;
}

/**
 * Mock OIDC users defined in `apps/ui-staff/mock-oidc.users.json`. The subs of
 * these users match the seeded staff users from
 * `@ocom-verification/verification-shared` test data, so the API resolves the
 * matching seeded staff role for each login.
 */
const credentialsByRole: Record<StaffPortalBusinessRole, StaffPortalCredentials> = {
	'tech admin': { email: 'tech.admin@ownercommunity.onmicrosoft.com', password: 'password' },
	'case manager': { email: 'staff@ownercommunity.onmicrosoft.com', password: 'password' },
	finance: { email: 'staff@ownercommunity.onmicrosoft.com', password: 'password' },
	'service line owner': { email: 'staff@ownercommunity.onmicrosoft.com', password: 'password' },
};

interface StaffPortalSession {
	context: BrowserContext;
	page: Page;
	authenticated: boolean;
}

const sessions = new Map<string, StaffPortalSession>();

/**
 * Return an authenticated staff-portal page for the given business role.
 *
 * Browser contexts are reused across scenarios (one per mock OIDC user), so the
 * OIDC session survives the per-scenario database reseed and only the first
 * scenario per user pays the login cost. The login flow only runs once per
 * session — re-running it would navigate the page away from whatever screen
 * the current step left it on.
 */
export async function staffPortalPageFor(role: StaffPortalBusinessRole): Promise<Page> {
	const credentials = credentialsByRole[role];
	let session = sessions.get(credentials.email);
	if (!session) {
		const context = await infrastructure.newPortalContext('staff');
		const page = await context.newPage();
		session = { context, page, authenticated: false };
		sessions.set(credentials.email, session);
	}
	if (!session.authenticated) {
		await performOAuth2Login(session.page, credentials, '/auth-redirect');
		session.authenticated = true;
	}
	return session.page;
}

/** Close every staff-portal browser context opened by the suite. */
export async function closeStaffPortalSessions(): Promise<void> {
	for (const session of sessions.values()) {
		await session.context.close().catch(() => undefined);
	}
	sessions.clear();
}
