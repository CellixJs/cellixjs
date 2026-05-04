import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock RequireAuth so tests don't depend on OIDC context behavior
vi.mock('@cellix/ui-core', () => ({
	RequireAuth: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, {}, children),
}));

// Mock ApolloConnection so tests don't need a GraphQL server
vi.mock('./components/ui/organisms/apollo-connection/index.tsx', () => ({
	ApolloConnection: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, {}, children),
}));

// Mock route packages with identifiable content per section
vi.mock('@ocom/ui-staff-route-root', () => ({ Root: () => React.createElement('div', {}, 'root-section') }));
vi.mock('@ocom/ui-staff-route-community-management', () => ({ Root: () => React.createElement('div', {}, 'community-management-section') }));
vi.mock('@ocom/ui-staff-route-user-management', () => ({ Root: () => React.createElement('div', {}, 'user-management-section') }));
vi.mock('@ocom/ui-staff-route-finance', () => ({ Root: () => React.createElement('div', {}, 'finance-section') }));
vi.mock('@ocom/ui-staff-route-tech-admin', () => ({ Root: () => React.createElement('div', {}, 'tech-admin-section') }));

// Helper to mock useAuth with a specific roles claim in the OIDC profile
function mockAuthWithRoles(roles: string[]) {
	vi.doMock('react-oidc-context', () => ({
		useAuth: () => ({
			user: { profile: { roles, email: 'staff@test.com', given_name: 'Staff', family_name: 'User' } },
			signoutRedirect: vi.fn(),
		}),
	}));
}

function mockAuthNoUser() {
	vi.doMock('react-oidc-context', () => ({
		useAuth: () => ({
			user: null,
			signoutRedirect: vi.fn(),
		}),
	}));
}

async function renderAppAt(path: string): Promise<string> {
	// Re-import App after mock changes so module is fresh
	const { default: App } = await import('./App');
	return renderToString(
		<MemoryRouter initialEntries={[path]}>
			<App />
		</MemoryRouter>,
	);
}

import App from './App';

describe('App – static routes', () => {
	it('renders root section without throwing', () => {
		const html = renderToString(<MemoryRouter><App /></MemoryRouter>);
		expect(typeof html).toBe('string');
		expect(html.length).toBeGreaterThan(0);
	});

	it('renders auth-redirect route without throwing', () => {
		const html = renderToString(<MemoryRouter initialEntries={['/auth-redirect']}><App /></MemoryRouter>);
		expect(typeof html).toBe('string');
	});

	it('/unauthorized renders the Unauthorized page', () => {
		const html = renderToString(<MemoryRouter initialEntries={['/unauthorized']}><App /></MemoryRouter>);
		expect(html).toContain('Unauthorized');
	});
});

describe('App – role authorization: Staff.TechAdmin', () => {
	beforeEach(() => { mockAuthWithRoles(['Staff.TechAdmin']); vi.resetModules(); });

	it('/staff/tech → renders tech-admin section', async () => {
		expect(await renderAppAt('/staff/tech')).toContain('tech-admin-section');
	});

	it('/staff/community → redirects to /unauthorized (not rendered)', async () => {
		const html = await renderAppAt('/staff/community');
		expect(html).not.toContain('community-management-section');
	});

	it('/staff/users → redirects to /unauthorized (not rendered)', async () => {
		const html = await renderAppAt('/staff/users');
		expect(html).not.toContain('user-management-section');
	});

	it('/staff/finance → redirects to /unauthorized (not rendered)', async () => {
		const html = await renderAppAt('/staff/finance');
		expect(html).not.toContain('finance-section');
	});
});

describe('App – role authorization: Staff.Finance', () => {
	beforeEach(() => { mockAuthWithRoles(['Staff.Finance']); vi.resetModules(); });

	it('/staff/finance → renders finance section', async () => {
		expect(await renderAppAt('/staff/finance')).toContain('finance-section');
	});

	it('/staff/community → redirects to /unauthorized (not rendered)', async () => {
		const html = await renderAppAt('/staff/community');
		expect(html).not.toContain('community-management-section');
	});

	it('/staff/users → redirects to /unauthorized (not rendered)', async () => {
		const html = await renderAppAt('/staff/users');
		expect(html).not.toContain('user-management-section');
	});

	it('/staff/tech → redirects to /unauthorized (not rendered)', async () => {
		const html = await renderAppAt('/staff/tech');
		expect(html).not.toContain('tech-admin-section');
	});
});

describe('App – role authorization: Staff.CaseManager', () => {
	beforeEach(() => { mockAuthWithRoles(['Staff.CaseManager']); vi.resetModules(); });

	it('/staff/community → renders community-management section', async () => {
		expect(await renderAppAt('/staff/community')).toContain('community-management-section');
	});

	it('/staff/users → renders user-management section', async () => {
		expect(await renderAppAt('/staff/users')).toContain('user-management-section');
	});

	it('/staff/finance → redirects to /unauthorized (not rendered)', async () => {
		const html = await renderAppAt('/staff/finance');
		expect(html).not.toContain('finance-section');
	});

	it('/staff/tech → redirects to /unauthorized (not rendered)', async () => {
		const html = await renderAppAt('/staff/tech');
		expect(html).not.toContain('tech-admin-section');
	});
});

describe('App – role authorization: Staff.ServiceLineOwner', () => {
	beforeEach(() => { mockAuthWithRoles(['Staff.ServiceLineOwner']); vi.resetModules(); });

	it('/staff/community → renders community-management section', async () => {
		expect(await renderAppAt('/staff/community')).toContain('community-management-section');
	});

	it('/staff/users → renders user-management section', async () => {
		expect(await renderAppAt('/staff/users')).toContain('user-management-section');
	});

	it('/staff/finance → redirects to /unauthorized (not rendered)', async () => {
		const html = await renderAppAt('/staff/finance');
		expect(html).not.toContain('finance-section');
	});

	it('/staff/tech → redirects to /unauthorized (not rendered)', async () => {
		const html = await renderAppAt('/staff/tech');
		expect(html).not.toContain('tech-admin-section');
	});
});

describe('App – role authorization: no roles', () => {
	beforeEach(() => { mockAuthNoUser(); vi.resetModules(); });

	it('/staff/community → redirects to /unauthorized', async () => {
		const html = await renderAppAt('/staff/community');
		expect(html).not.toContain('community-management-section');
	});

	it('/staff/users → redirects to /unauthorized', async () => {
		const html = await renderAppAt('/staff/users');
		expect(html).not.toContain('user-management-section');
	});

	it('/staff/finance → redirects to /unauthorized', async () => {
		const html = await renderAppAt('/staff/finance');
		expect(html).not.toContain('finance-section');
	});

	it('/staff/tech → redirects to /unauthorized', async () => {
		const html = await renderAppAt('/staff/tech');
		expect(html).not.toContain('tech-admin-section');
	});
});
