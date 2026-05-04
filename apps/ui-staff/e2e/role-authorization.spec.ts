/**
 * Playwright e2e tests: Entra app-role route authorization for the ui-staff portal.
 *
 * Strategy: inject a fake OIDC session directly into sessionStorage before page load.
 * This lets us test every role × route combination without restarting the mock auth server.
 *
 * The OIDC authority / client_id values must match apps/ui-staff/src/config/oidc-config.tsx.
 */
import { expect, test, type Page } from '@playwright/test';

// --- Constants matching oidc-config.tsx ---
const AUTHORITY = 'https://mock-auth.ownercommunity.localhost:1355/staff';
const CLIENT_ID = 'mock-client';
const STORAGE_KEY = `oidc.user:${AUTHORITY}:${CLIENT_ID}`;

// --- Helpers ---

function b64url(obj: Record<string, unknown>): string {
	return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/**
 * Builds a minimal but structurally valid OIDC User JSON suitable for
 * sessionStorage injection. oidc-client-ts restores stored users without
 * re-validating the JWT signature, so the token strings only need to be
 * three-part base64url values.
 */
function buildOidcSession(roles: string[], name = 'Test User', email = 'testuser@example.com'): string {
	const now = Math.floor(Date.now() / 1000);
	const exp = now + 3600; // 1 hour from now — prevents automatic silent refresh
	const profile = {
		sub: 'test-user-id',
		iss: AUTHORITY,
		aud: CLIENT_ID,
		exp,
		iat: now,
		name,
		email,
		roles,
	};
	const header = b64url({ alg: 'RS256', typ: 'JWT' });
	const payload = b64url(profile);
	// Signature is not validated on storage restore — use a placeholder
	const fakeJwt = `${header}.${payload}.fakeSignatureForE2ETesting`;

	return JSON.stringify({
		id_token: fakeJwt,
		session_state: null,
		access_token: fakeJwt,
		refresh_token: null,
		token_type: 'Bearer',
		scope: 'openid',
		profile,
		expires_at: exp,
	});
}

/** Injects an OIDC session into sessionStorage before any page script runs. */
async function injectOidcSession(page: Page, roles: string[]): Promise<void> {
	const sessionValue = buildOidcSession(roles);
	await page.addInitScript(
		({ key, value }: { key: string; value: string }) => {
			sessionStorage.setItem(key, value);
		},
		{ key: STORAGE_KEY, value: sessionValue },
	);
}

// --- Test matrix ---

const ROUTES = {
	community: '/staff/community',
	users: '/staff/users',
	finance: '/staff/finance',
	tech: '/staff/tech',
} as const;

const ROLES = {
	TechAdmin: 'Staff.TechAdmin',
	Finance: 'Staff.Finance',
	ServiceLineOwner: 'Staff.ServiceLineOwner',
	CaseManager: 'Staff.CaseManager',
} as const;

/**
 * Navigates to a path and waits for the React app to have rendered meaningful content.
 * Guards against the portless proxy returning a 404 before the app is registered.
 */
async function navigateTo(page: Page, path: string): Promise<void> {
	await page.goto(path, { waitUntil: 'domcontentloaded' });
	// Wait for the React root to contain rendered content (i.e., the app mounted)
	await page.waitForFunction(() => {
		const root = document.getElementById('root');
		return root && root.childElementCount > 0;
	}, { timeout: 8000 });
}

/** The section title is rendered as a heading — use heading role to avoid matching nav labels. */
async function expectAuthorized(page: Page, sectionTitle: string): Promise<void> {
	// The StaffRouteShell renders the section title as a plain div with fontSize 22px,
	// so we find it by its exact text within the header area.
	await expect(page.getByText(sectionTitle, { exact: true }).first()).toBeVisible({ timeout: 8000 });
	await expect(page.locator('h2').filter({ hasText: 'Unauthorized' })).not.toBeVisible();
}

async function expectUnauthorized(page: Page): Promise<void> {
	await expect(page.locator('h2').filter({ hasText: 'Unauthorized' })).toBeVisible({ timeout: 8000 });
	await expect(page.getByText('You do not have permission to view this page.')).toBeVisible();
}

// ============================================================
// Staff.TechAdmin
// ============================================================
test.describe('Staff.TechAdmin role', () => {
	test.beforeEach(async ({ page }) => {
		await injectOidcSession(page, [ROLES.TechAdmin]);
	});

	test('can access /staff/tech', async ({ page }) => {
		await navigateTo(page, ROUTES.tech);
		await expectAuthorized(page, 'Tech Admin');
	});

	test('is denied /staff/finance', async ({ page }) => {
		await navigateTo(page, ROUTES.finance);
		await expectUnauthorized(page);
	});

	test('is denied /staff/community', async ({ page }) => {
		await navigateTo(page, ROUTES.community);
		await expectUnauthorized(page);
	});

	test('is denied /staff/users', async ({ page }) => {
		await navigateTo(page, ROUTES.users);
		await expectUnauthorized(page);
	});
});

// ============================================================
// Staff.Finance
// ============================================================
test.describe('Staff.Finance role', () => {
	test.beforeEach(async ({ page }) => {
		await injectOidcSession(page, [ROLES.Finance]);
	});

	test('can access /staff/finance', async ({ page }) => {
		await navigateTo(page, ROUTES.finance);
		await expectAuthorized(page, 'Finance');
	});

	test('is denied /staff/tech', async ({ page }) => {
		await navigateTo(page, ROUTES.tech);
		await expectUnauthorized(page);
	});

	test('is denied /staff/community', async ({ page }) => {
		await navigateTo(page, ROUTES.community);
		await expectUnauthorized(page);
	});

	test('is denied /staff/users', async ({ page }) => {
		await navigateTo(page, ROUTES.users);
		await expectUnauthorized(page);
	});
});

// ============================================================
// Staff.CaseManager
// ============================================================
test.describe('Staff.CaseManager role', () => {
	test.beforeEach(async ({ page }) => {
		await injectOidcSession(page, [ROLES.CaseManager]);
	});

	test('can access /staff/community', async ({ page }) => {
		await navigateTo(page, ROUTES.community);
		await expectAuthorized(page, 'Community Management');
	});

	test('can access /staff/users', async ({ page }) => {
		await navigateTo(page, ROUTES.users);
		await expectAuthorized(page, 'User Management');
	});

	test('is denied /staff/finance', async ({ page }) => {
		await navigateTo(page, ROUTES.finance);
		await expectUnauthorized(page);
	});

	test('is denied /staff/tech', async ({ page }) => {
		await navigateTo(page, ROUTES.tech);
		await expectUnauthorized(page);
	});
});

// ============================================================
// Staff.ServiceLineOwner
// ============================================================
test.describe('Staff.ServiceLineOwner role', () => {
	test.beforeEach(async ({ page }) => {
		await injectOidcSession(page, [ROLES.ServiceLineOwner]);
	});

	test('can access /staff/community', async ({ page }) => {
		await navigateTo(page, ROUTES.community);
		await expectAuthorized(page, 'Community Management');
	});

	test('can access /staff/users', async ({ page }) => {
		await navigateTo(page, ROUTES.users);
		await expectAuthorized(page, 'User Management');
	});

	test('is denied /staff/finance', async ({ page }) => {
		await navigateTo(page, ROUTES.finance);
		await expectUnauthorized(page);
	});

	test('is denied /staff/tech', async ({ page }) => {
		await navigateTo(page, ROUTES.tech);
		await expectUnauthorized(page);
	});
});

// ============================================================
// No roles (authenticated but no app roles)
// ============================================================
test.describe('No app roles (authenticated, no roles)', () => {
	test.beforeEach(async ({ page }) => {
		await injectOidcSession(page, []);
	});

	test('is denied /staff/community', async ({ page }) => {
		await navigateTo(page, ROUTES.community);
		await expectUnauthorized(page);
	});

	test('is denied /staff/users', async ({ page }) => {
		await navigateTo(page, ROUTES.users);
		await expectUnauthorized(page);
	});

	test('is denied /staff/finance', async ({ page }) => {
		await navigateTo(page, ROUTES.finance);
		await expectUnauthorized(page);
	});

	test('is denied /staff/tech', async ({ page }) => {
		await navigateTo(page, ROUTES.tech);
		await expectUnauthorized(page);
	});
});

// ============================================================
// Nav link visibility
// ============================================================
test.describe('Nav link visibility in StaffRouteShell', () => {
	test('TechAdmin sees only Tech Admin nav link', async ({ page }) => {
		await injectOidcSession(page, [ROLES.TechAdmin]);
		await navigateTo(page, ROUTES.tech);
		await expect(page.getByRole('link', { name: 'Tech Admin' })).toBeVisible({ timeout: 5000 });
		await expect(page.getByRole('link', { name: 'Finance' })).not.toBeVisible();
		await expect(page.getByRole('link', { name: 'Community Management' })).not.toBeVisible();
		await expect(page.getByRole('link', { name: 'User Management' })).not.toBeVisible();
	});

	test('Finance sees only Finance nav link', async ({ page }) => {
		await injectOidcSession(page, [ROLES.Finance]);
		await navigateTo(page, ROUTES.finance);
		await expect(page.getByRole('link', { name: 'Finance' })).toBeVisible({ timeout: 5000 });
		await expect(page.getByRole('link', { name: 'Tech Admin' })).not.toBeVisible();
		await expect(page.getByRole('link', { name: 'Community Management' })).not.toBeVisible();
	});

	test('CaseManager sees Community Management and User Management nav links', async ({ page }) => {
		await injectOidcSession(page, [ROLES.CaseManager]);
		await navigateTo(page, ROUTES.community);
		await expect(page.getByRole('link', { name: 'Community Management' })).toBeVisible({ timeout: 5000 });
		await expect(page.getByRole('link', { name: 'User Management' })).toBeVisible({ timeout: 5000 });
		await expect(page.getByRole('link', { name: 'Finance' })).not.toBeVisible();
		await expect(page.getByRole('link', { name: 'Tech Admin' })).not.toBeVisible();
	});
});
