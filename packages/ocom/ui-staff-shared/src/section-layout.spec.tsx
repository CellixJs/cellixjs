import type React from 'react';
import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SectionLayout } from './section-layout';
import { TeamOutlined } from '@ant-design/icons';
import type { PageLayoutProps } from '@ocom/ui-shared';

import { act } from 'react-dom/test-utils';

const renderIntoDocument = (node: React.ReactNode) => {
	const container = document.createElement('div');
	document.body.appendChild(container);
	act(() => {
		createRoot(container).render(node);
	});
	return container;
};

describe('SectionLayout merging behaviour', () => {
	it('renders canonical staff navigation merged with consumer pageLayouts', async () => {
		const consumerLayouts = [
			{
				path: '/staff/community',
				title: 'Community Management',
				icon: <TeamOutlined />,
				id: 'community',
				parent: 'ROOT',
			},
		];

		const container = renderIntoDocument(
			<MemoryRouter initialEntries={["/staff"]}>
				<Routes>
					<Route path="/staff/*" element={<SectionLayout pageLayouts={consumerLayouts as PageLayoutProps[]} />} />
				</Routes>
			</MemoryRouter>
		);

		// Wait a tick for ant design components to mount
		await new Promise((r) => setTimeout(r, 10));

		// Top-level menu items expected
		expect(container.textContent).toContain('Home');
		expect(container.textContent).toContain('Community Management');
		expect(container.textContent).toContain('User Management');
		expect(container.textContent).toContain('Finance');
		expect(container.textContent).toContain('Tech Admin');
	});

	it('preserves default parent when consumer entry omits parent field', async () => {
		const consumerLayouts = [
			{
				path: '/staff/community',
				title: 'Community Management',
				icon: <TeamOutlined />,
				id: 'community',
				// parent omitted intentionally to ensure merge preserves default 'ROOT'
			},
		];

		const container = renderIntoDocument(
			<MemoryRouter initialEntries={["/staff"]}>
				<Routes>
					<Route path="/staff/*" element={<SectionLayout pageLayouts={consumerLayouts as PageLayoutProps[]} />} />
				</Routes>
			</MemoryRouter>
		);

		// Wait a tick for ant design components to mount
		await new Promise((r) => setTimeout(r, 10));

		// All canonical top-level items should still be present
		expect(container.textContent).toContain('Home');
		expect(container.textContent).toContain('Community Management');
		expect(container.textContent).toContain('User Management');
		expect(container.textContent).toContain('Finance');
		expect(container.textContent).toContain('Tech Admin');
	});
});

import { PlaceholderPage, StaffAuthProvider } from './index';

describe('PlaceholderPage', () => {
	it('renders a message when no StaffAuthContext is provided and shows no resolved roles', async () => {
		const container = renderIntoDocument(<PlaceholderPage sectionName="Test Section" description="desc" />);

		// Wait a tick for any async mounts
		await new Promise((r) => setTimeout(r, 10));

		expect(container.textContent).toContain('Placeholder — proof surface');
		expect(container.textContent).toContain('No authenticated identity available');
		expect(container.textContent).toContain('(none)');
	});

	it('resolves roles from StaffAuthContext.roles array and shows identity', async () => {
		const auth = {
			name: 'Alice Example',
			roles: ['admin', 'editor'],
		};

		const container = renderIntoDocument(
			<StaffAuthProvider value={auth}>
				<PlaceholderPage sectionName="Sec" />
			</StaffAuthProvider>,
		);

		await new Promise((r) => setTimeout(r, 10));

		expect(container.textContent).toContain('Alice Example');
		expect(container.textContent).toContain('admin');
		expect(container.textContent).toContain('editor');
	});

	it('uses explicitRoles when provided and can read raw.profile role (string) for identity', async () => {
		const auth = {
			raw: { role: 'member', email: 'm@example.com' },
		};

		const container = renderIntoDocument(
			<StaffAuthProvider value={auth}>
				<PlaceholderPage sectionName="Sec" explicitRoles={["explicit-role"]} />
			</StaffAuthProvider>,
		);

		await new Promise((r) => setTimeout(r, 10));

		// explicitRoles should win over auth-derived roles
		expect(container.textContent).toContain('explicit-role');
		// identity display should fall back to raw email
		expect(container.textContent).toContain('m@example.com');
	});
});
