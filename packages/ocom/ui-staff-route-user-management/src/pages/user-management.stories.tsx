import type { Meta, StoryObj } from '@storybook/react';
import { StaffAuthProvider } from '@ocom/ui-staff-shared';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StaffRolesListDocument, StaffUsersListDocument } from '../generated.tsx';
import { UserManagementPage } from './user-management.tsx';

const mockStaffUsers = [
	{ id: '1', displayName: 'Alice Admin', email: 'alice@example.com', createdAt: '2024-01-01T00:00:00.000Z', role: { id: 'r1', roleName: 'Case Manager' } },
	{ id: '2', displayName: 'Bob Staff', email: 'bob@example.com', createdAt: '2024-02-01T00:00:00.000Z', role: null },
];

const mockStaffRoles = [
	{ id: 'r1', roleName: 'Case Manager', enterpriseAppRole: 'Staff.CaseManager', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-15T00:00:00.000Z' },
	{ id: 'r2', roleName: 'Finance', enterpriseAppRole: 'Staff.Finance', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-15T00:00:00.000Z' },
];

const mockAuth = {
	permissions: {
		canViewStaffUsers: true,
		canManageUsers: true,
		canViewRoles: true,
		canAddRole: true,
		canEditRole: true,
	},
};

const meta: Meta<typeof UserManagementPage> = {
	title: 'Pages/Staff/User Management/User Management',
	component: UserManagementPage,
	parameters: {
		layout: 'padded',
	},
};

export default meta;
type Story = StoryObj<typeof UserManagementPage>;

export const StaffUsersTab: Story = {
	parameters: {
		apolloClient: {
			mocks: [{ request: { query: StaffUsersListDocument }, result: { data: { staffUsers: mockStaffUsers } } }],
		},
	},
	render: () => (
		<StaffAuthProvider value={mockAuth}>
			<MemoryRouter initialEntries={['/staff-users']}>
				<Routes>
					<Route
						path="/*"
						element={<UserManagementPage />}
					/>
				</Routes>
			</MemoryRouter>
		</StaffAuthProvider>
	),
};

export const StaffRolesTab: Story = {
	parameters: {
		apolloClient: {
			mocks: [{ request: { query: StaffRolesListDocument }, result: { data: { staffRoles: mockStaffRoles } } }],
		},
	},
	render: () => (
		<StaffAuthProvider value={mockAuth}>
			<MemoryRouter initialEntries={['/staff-roles']}>
				<Routes>
					<Route
						path="/*"
						element={<UserManagementPage />}
					/>
				</Routes>
			</MemoryRouter>
		</StaffAuthProvider>
	),
};
