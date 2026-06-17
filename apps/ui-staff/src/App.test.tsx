import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// Mock react-oidc-context useAuth to ensure SSR render is deterministic
vi.mock('react-oidc-context', () => ({ useAuth: () => ({ user: undefined, signoutRedirect: () => Promise.resolve() }) }));

// Mock RequireAuth from @cellix/ui-core so tests don't depend on oidc context behavior
vi.mock('@cellix/ui-core', () => ({
	RequireAuth: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, {}, children),
}));

// Mock useStaffPermissions so StaffSection bypasses Apollo query during SSR and grants all permissions
vi.mock('./hooks/use-staff-permissions.ts', () => ({
	useStaffPermissions: () => ({
		loading: false,
		permissions: {
			canManageCommunities: true,
			canManageUsers: true,
			canManageFinance: true,
			canManageTechAdmin: true,
		},
		user: undefined,
		error: undefined,
	}),
}));

// Mock route packages used by App to render simple identifiable markup
vi.mock('@ocom/ui-staff-route-root', () => ({
	Root: () => React.createElement('div', {}, 'RootSection'),
}));
vi.mock('@ocom/ui-staff-route-community-management', () => ({
	Root: () => React.createElement('div', {}, 'CommunityManagement'),
}));
vi.mock('@ocom/ui-staff-route-user-management', () => ({
	Root: () => React.createElement('div', {}, 'UserManagement'),
}));
vi.mock('@ocom/ui-staff-route-finance', () => ({
	Root: () => React.createElement('div', {}, 'Finance'),
}));
vi.mock('@ocom/ui-staff-route-tech-admin', () => ({
	Root: () => React.createElement('div', {}, 'TechAdmin'),
}));

import App from './App.tsx';

describe('App', () => {
	it('renders root section without throwing', () => {
		const html = renderToString(
			<MemoryRouter>
				<App />
			</MemoryRouter>,
		);
		expect(typeof html).toBe('string');
		expect(html.length).toBeGreaterThan(0);
		expect(html).toContain('RootSection');
	});

	it('renders auth-redirect route without throwing', () => {
		const html = renderToString(
			<MemoryRouter initialEntries={['/auth-redirect']}>
				<App />
			</MemoryRouter>,
		);
		expect(typeof html).toBe('string');
		// Navigate may render no markup during SSR; ensure render does not throw and returns a string
	});

	it('renders unauthorized route without throwing and contains Unauthorized text', () => {
		const html = renderToString(
			<MemoryRouter initialEntries={['/unauthorized']}>
				<App />
			</MemoryRouter>,
		);
		expect(typeof html).toBe('string');
		expect(html).toContain('Unauthorized');
	});

	it('navigates to staff index without throwing (index redirects via Navigate)', () => {
		// React renderToString does not follow Navigate redirects synchronously,
		// so the output may be empty - this verifies the render does not throw.
		const html = renderToString(
			<MemoryRouter initialEntries={['/staff']}>
				<App />
			</MemoryRouter>,
		);
		expect(typeof html).toBe('string');
	});

	it('navigates to staff/community-management and renders CommunityManagement', () => {
		const html = renderToString(
			<MemoryRouter initialEntries={['/staff/community-management']}>
				<App />
			</MemoryRouter>,
		);
		expect(html).toContain('CommunityManagement');
	});

	it('navigates to /staff/user-management and renders UserManagement', () => {
		const html = renderToString(
			<MemoryRouter initialEntries={['/staff/user-management']}>
				<App />
			</MemoryRouter>,
		);
		expect(html).toContain('UserManagement');
	});

	it('navigates to /staff/finance and renders Finance', () => {
		const html = renderToString(
			<MemoryRouter initialEntries={['/staff/finance']}>
				<App />
			</MemoryRouter>,
		);
		expect(html).toContain('Finance');
	});

	it('navigates to /staff/tech and renders TechAdmin', () => {
		const html = renderToString(
			<MemoryRouter initialEntries={['/staff/tech']}>
				<App />
			</MemoryRouter>,
		);
		expect(html).toContain('TechAdmin');
	});
});
