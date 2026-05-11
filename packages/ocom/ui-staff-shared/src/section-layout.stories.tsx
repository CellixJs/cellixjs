import { TeamOutlined } from '@ant-design/icons';
import type { PageLayoutProps } from '@ocom/ui-shared';
import type React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PlaceholderPage, StaffAuthProvider } from './index';
import { SectionLayout } from './section-layout';

const renderIntoDocument = (node: React.ReactNode) => {
	const container = document.createElement('div');
	document.body.appendChild(container);
	act(() => {
		createRoot(container).render(node);
	});
	return container;
};

describe('SectionLayout merging behaviour', () => {
	it('renders only the menu items the user has permission for', async () => {
		const container = renderIntoDocument(
			<MemoryRouter initialEntries={['/staff']}>
				<StaffAuthProvider
					value={{
						permissions: {
							canManageCommunities: true,
							canManageUsers: false,
							canManageFinance: true,
							canManageTechAdmin: false,
						},
					}}
				>
					<Routes>
						<Route
							path="/staff/*"
							element={<SectionLayout pageLayouts={[]} />}
						/>
					</Routes>
				</StaffAuthProvider>
			</MemoryRouter>,
		);

		await new Promise((r) => setTimeout(r, 10));

		expect(container.textContent).toContain('Communities');
		expect(container.textContent).not.toContain('Users');
		expect(container.textContent).toContain('Finance');
		expect(container.textContent).not.toContain('Tech Admin');
	});

	it('shows no menu items when permissions are undefined (loading or no role assigned)', async () => {
		const container = renderIntoDocument(
			<MemoryRouter initialEntries={['/staff']}>
				<Routes>
					<Route
						path="/staff/*"
						element={<SectionLayout pageLayouts={[]} />}
					/>
				</Routes>
			</MemoryRouter>,
		);

		await new Promise((r) => setTimeout(r, 10));

		expect(container.textContent).not.toContain('Communities');
		expect(container.textContent).not.toContain('Users');
		expect(container.textContent).not.toContain('Finance');
		expect(container.textContent).not.toContain('Tech Admin');
	});

	it('renders finance menu from JWT role when backend permissions are unavailable', async () => {
		const container = renderIntoDocument(
			<MemoryRouter initialEntries={['/staff']}>
				<StaffAuthProvider
					value={{
						roles: ['Staff.Finance'],
					}}
				>
					<Routes>
						<Route
							path="/staff/*"
							element={<SectionLayout pageLayouts={[]} />}
						/>
					</Routes>
				</StaffAuthProvider>
			</MemoryRouter>,
		);

		await new Promise((r) => setTimeout(r, 10));

		expect(container.textContent).not.toContain('Communities');
		expect(container.textContent).not.toContain('Users');
		expect(container.textContent).toContain('Finance');
		expect(container.textContent).not.toContain('Tech Admin');
	});

	it('preserves default parent when consumer entry omits parent field', async () => {
		const consumerLayouts = [
			{
				path: '/staff/user-management',
				title: 'User Management',
				icon: <TeamOutlined />,
				id: 'users',
				// parent omitted intentionally to ensure merge preserves default 'ROOT'
			},
		];

		const container = renderIntoDocument(
			<MemoryRouter initialEntries={['/staff']}>
				<StaffAuthProvider
					value={{
						permissions: {
							canManageCommunities: true,
							canManageUsers: true,
							canManageFinance: true,
							canManageTechAdmin: true,
						},
					}}
				>
					<Routes>
						<Route
							path="/staff/*"
							element={<SectionLayout pageLayouts={consumerLayouts as PageLayoutProps[]} />}
						/>
					</Routes>
				</StaffAuthProvider>
			</MemoryRouter>,
		);

		// Wait a tick for ant design components to mount
		await new Promise((r) => setTimeout(r, 10));

		// All canonical top-level items should still be present
		expect(container.textContent).not.toContain('Home');
		expect(container.textContent).toContain('Communities');
		expect(container.textContent).toContain('Users');
		expect(container.textContent).toContain('Finance');
		expect(container.textContent).toContain('Tech Admin');
	});
});

describe('PlaceholderPage', () => {
	it('renders a message when no StaffAuthContext is provided and shows no resolved roles', async () => {
		const container = renderIntoDocument(
			<PlaceholderPage
				sectionName="Test Section"
				description="desc"
			/>,
		);

		// Wait a tick for any async mounts
		await new Promise((r) => setTimeout(r, 10));

		expect(container.textContent).toContain('Placeholder');
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
				<PlaceholderPage
					sectionName="Sec"
					explicitRoles={['explicit-role']}
				/>
			</StaffAuthProvider>,
		);

		await new Promise((r) => setTimeout(r, 10));

		// explicitRoles should win over auth-derived roles
		expect(container.textContent).toContain('explicit-role');
		// identity display should fall back to raw email
		expect(container.textContent).toContain('m@example.com');
	});
});
