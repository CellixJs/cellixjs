import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeAll } from 'vitest';

// Mock RequireAuth from @cellix/ui-core so tests don't depend on oidc context behavior
vi.mock('@cellix/ui-core', () => ({
	RequireAuth: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, {}, children),
}));

// Mock StaffAuthProvider so tests don't need package implementation
vi.mock('@ocom/ui-staff-shared', () => ({
	StaffAuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, {}, children),
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

import App from './App';

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

	it('navigates to staff index and renders CommunityManagement', () => {
		const html = renderToString(
			<MemoryRouter initialEntries={["/staff"]}>
				<App />
			</MemoryRouter>,
		);
		expect(html).toContain('CommunityManagement');
	});

	it('navigates to /staff/users and renders UserManagement', () => {
		const html = renderToString(
			<MemoryRouter initialEntries={["/staff/users"]}>
				<App />
			</MemoryRouter>,
		);
		expect(html).toContain('UserManagement');
	});

	it('navigates to /staff/finance and renders Finance', () => {
		const html = renderToString(
			<MemoryRouter initialEntries={["/staff/finance"]}>
				<App />
			</MemoryRouter>,
		);
		expect(html).toContain('Finance');
	});

	it('navigates to /staff/tech and renders TechAdmin', () => {
		const html = renderToString(
			<MemoryRouter initialEntries={["/staff/tech"]}>
				<App />
			</MemoryRouter>,
		);
		expect(html).toContain('TechAdmin');
	});
});
