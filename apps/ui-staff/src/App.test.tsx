import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// Mock RequireAuth from @cellix/ui-core so tests don't depend on oidc context behavior
vi.mock('@cellix/ui-core', () => ({
	RequireAuth: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, {}, children),
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
});
