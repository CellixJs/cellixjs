import type * as React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequireRole } from './require-role.tsx';
import { StaffAuthProvider } from './staff-route-shell.tsx';

const useQueryMock = vi.fn();
vi.mock('@apollo/client', () => ({
	gql: (strings: TemplateStringsArray, ...values: unknown[]) => String.raw({ raw: strings }, ...values),
	useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

const Protected: React.FC = () => <div>protected content</div>;

describe('RequireRole', () => {
	beforeEach(() => {
		useQueryMock.mockReset();
	});

	it('renders children when the permission key is true', () => {
		useQueryMock.mockReturnValue({
			loading: false,
			error: undefined,
			data: {
				staffUserCurrent: {
					role: {
						permissions: {
							communityPermissions: { canManageCommunities: false },
							userPermissions: { canManageUsers: false },
							financePermissions: { canManageFinance: false },
							techAdminPermissions: { canManageTechAdmin: true },
						},
					},
				},
			},
		});
		const identity = {};
		const html = renderToString(
			<MemoryRouter>
				<StaffAuthProvider value={identity}>
					<RequireRole
						roles={[]}
						permKey="canManageTechAdmin"
					>
						<Protected />
					</RequireRole>
				</StaffAuthProvider>
			</MemoryRouter>,
		);
		expect(html).toContain('protected content');
	});

	it('redirects to /unauthorized when the permission key is false', () => {
		useQueryMock.mockReturnValue({
			loading: false,
			error: undefined,
			data: {
				staffUserCurrent: {
					role: {
						permissions: {
							communityPermissions: { canManageCommunities: false },
							userPermissions: { canManageUsers: false },
							financePermissions: { canManageFinance: true },
							techAdminPermissions: { canManageTechAdmin: false },
						},
					},
				},
			},
		});
		const identity = {};
		const html = renderToString(
			<MemoryRouter initialEntries={['/staff/tech']}>
				<StaffAuthProvider value={identity}>
					<RequireRole
						roles={[]}
						permKey="canManageTechAdmin"
					>
						<Protected />
					</RequireRole>
				</StaffAuthProvider>
			</MemoryRouter>,
		);
		expect(html).not.toContain('protected content');
	});

	it('redirects to /unauthorized when query returns an error', () => {
		useQueryMock.mockReturnValue({
			loading: false,
			error: new Error('network error'),
			data: undefined,
		});
		const identity = {};
		const html = renderToString(
			<MemoryRouter initialEntries={['/staff/tech']}>
				<StaffAuthProvider value={identity}>
					<RequireRole
						roles={[]}
						permKey="canManageTechAdmin"
					>
						<Protected />
					</RequireRole>
				</StaffAuthProvider>
			</MemoryRouter>,
		);
		expect(html).not.toContain('protected content');
	});

	it('does not render protected content while loading', () => {
		useQueryMock.mockReturnValue({
			loading: true,
			error: undefined,
			data: undefined,
		});
		const identity = {};
		const html = renderToString(
			<MemoryRouter>
				<StaffAuthProvider value={identity}>
					<RequireRole
						roles={[]}
						permKey="canManageTechAdmin"
					>
						<Protected />
					</RequireRole>
				</StaffAuthProvider>
			</MemoryRouter>,
		);
		expect(html).not.toContain('protected content');
	});

	it('redirects when permKey is not provided', () => {
		useQueryMock.mockReturnValue({
			loading: false,
			error: undefined,
			data: {
				staffUserCurrent: {
					role: {
						permissions: {
							communityPermissions: { canManageCommunities: true },
							userPermissions: { canManageUsers: true },
							financePermissions: { canManageFinance: true },
							techAdminPermissions: { canManageTechAdmin: true },
						},
					},
				},
			},
		});
		const identity = {};
		const html = renderToString(
			<MemoryRouter initialEntries={['/staff/tech']}>
				<StaffAuthProvider value={identity}>
					<RequireRole roles={[]}>
						<Protected />
					</RequireRole>
				</StaffAuthProvider>
			</MemoryRouter>,
		);
		expect(html).not.toContain('protected content');
	});

	it('redirects when role permissions are missing', () => {
		useQueryMock.mockReturnValue({
			loading: false,
			error: undefined,
			data: {
				staffUserCurrent: {},
			},
		});
		const identity = {};
		const html = renderToString(
			<MemoryRouter initialEntries={['/staff/tech']}>
				<StaffAuthProvider value={identity}>
					<RequireRole
						roles={[]}
						permKey="canManageTechAdmin"
					>
						<Protected />
					</RequireRole>
				</StaffAuthProvider>
			</MemoryRouter>,
		);
		expect(html).not.toContain('protected content');
	});
});
