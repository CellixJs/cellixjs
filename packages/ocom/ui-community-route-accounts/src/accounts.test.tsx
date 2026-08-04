// @vitest-environment jsdom
import type React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Accounts } from './accounts.tsx';

vi.mock('./pages/home.tsx', () => ({
	Home: () => <div data-testid="home-page">home</div>,
}));

vi.mock('./pages/create-community.tsx', () => ({
	CreateCommunity: () => <div data-testid="create-community-page">create community</div>,
}));

vi.mock('./section-layout.tsx', async () => {
	const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
	return {
		SectionLayout: () => (
			<div data-testid="section-layout">
				<actual.Outlet />
			</div>
		),
	};
});

describe('Accounts', () => {
	let container!: HTMLDivElement;
	let root!: ReturnType<typeof createRoot>;

	beforeEach(() => {
		vi.clearAllMocks();
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		if (root) {
			act(() => {
				root.unmount();
			});
		}
		container?.remove();
	});

	it('renders the home page at the root route', () => {
		act(() => {
			root.render(
				<MemoryRouter initialEntries={['/']}>
					<Accounts />
				</MemoryRouter>,
			);
		});

		expect(container.querySelector('[data-testid="home-page"]')).not.toBeNull();
	});

	it('renders the create community page', () => {
		act(() => {
			root.render(
				<MemoryRouter initialEntries={['/create-community']}>
					<Accounts />
				</MemoryRouter>,
			);
		});

		expect(container.querySelector('[data-testid="create-community-page"]')).not.toBeNull();
	});
});
