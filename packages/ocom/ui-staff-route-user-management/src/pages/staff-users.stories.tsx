import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react';
import { StaffAuthProvider } from '@ocom/ui-staff-shared';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CurrentStaffUserDocument, StaffRolesForSelectDocument, StaffUserDetailDocument, StaffUsersListDocument } from '../generated.tsx';
import { SectionLayout } from '../section-layout.tsx';
import { StaffUsersPage } from './staff-users.tsx';

const mockStaffUsers = [
	{ id: '1', displayName: 'Alice Admin', email: 'alice@example.com', createdAt: '2024-01-01T00:00:00.000Z', role: { id: 'r1', roleName: 'Case Manager' } },
	{ id: '2', displayName: 'Bob Staff', email: 'bob@example.com', createdAt: '2024-02-01T00:00:00.000Z', role: null },
];

const mockCurrentUser = {
	id: 'admin-1',
	displayName: 'Admin User',
	email: 'admin@example.com',
	createdAt: '2024-01-01T00:00:00.000Z',
	role: { id: 'r3', roleName: 'Tech Admin', enterpriseAppRole: 'Staff.TechAdmin' },
	activityLog: [],
};

const mockRolesForSelect = [
	{ id: 'r1', roleName: 'Case Manager', enterpriseAppRole: 'Staff.CaseManager' },
	{ id: 'r2', roleName: 'Finance', enterpriseAppRole: 'Staff.Finance' },
	{ id: 'r3', roleName: 'Tech Admin', enterpriseAppRole: 'Staff.TechAdmin' },
];

const mockUserDetail = {
	id: '1',
	displayName: 'Alice Admin',
	email: 'alice@example.com',
	createdAt: '2024-01-01T00:00:00.000Z',
	role: { id: 'r1', roleName: 'Case Manager', enterpriseAppRole: 'Staff.CaseManager' },
	activityLog: [
		{
			activityType: 'ROLE_ASSIGNED',
			activityDescription: 'Role "Case Manager" was assigned',
			activityByStaffUserId: 'admin-1',
			activityByStaffUserDisplayName: 'Admin User',
			createdAt: '2024-03-15T10:00:00Z',
		},
		{
			activityType: 'LOGIN',
			activityDescription: 'User logged in',
			activityByStaffUserId: '1',
			activityByStaffUserDisplayName: 'Alice Admin',
			createdAt: '2024-03-20T08:30:00Z',
		},
	],
};

const mockAuth = {
	name: 'Admin User',
	enterpriseAppRole: 'Staff.TechAdmin',
	permissions: {
		canViewStaffUsers: true,
		canManageUsers: true,
		canAssignStaffRoles: true,
		canManageTechAdmin: true,
		canViewRoles: true,
	},
};

const meta: Meta<typeof StaffUsersPage> = {
	title: 'Pages/Staff/User Management/Staff Users',
	component: StaffUsersPage,
	parameters: {
		layout: 'fullscreen',
	},
};

export default meta;
type Story = StoryObj<typeof StaffUsersPage>;

export const Default: Story = {
	parameters: {
		apolloClient: {
			mocks: [{ request: { query: StaffUsersListDocument }, result: { data: { staffUsers: mockStaffUsers } } }],
		},
	},
	render: () => (
		<StaffAuthProvider value={mockAuth}>
			<MemoryRouter initialEntries={['/staff/user-management/staff-users']}>
				<Routes>
					<Route
						path="/staff/user-management"
						element={<SectionLayout />}
					>
						<Route
							path="staff-users/*"
							element={<StaffUsersPage />}
						/>
					</Route>
				</Routes>
			</MemoryRouter>
		</StaffAuthProvider>
	),
};

export const StaffUserDetail: Story = {
	decorators: [
		(Story) => (
			<MockedProvider
				mocks={[
					{ request: { query: StaffUsersListDocument }, result: { data: { staffUsers: mockStaffUsers } } },
					{ request: { query: StaffUserDetailDocument, variables: { id: '1' } }, result: { data: { staffUserById: mockUserDetail } } },
					{ request: { query: StaffUserDetailDocument, variables: { id: '1' } }, result: { data: { staffUserById: mockUserDetail } } },
					{ request: { query: CurrentStaffUserDocument }, result: { data: { currentStaffUserAndCreateIfNotExists: mockCurrentUser } } },
					{ request: { query: CurrentStaffUserDocument }, result: { data: { currentStaffUserAndCreateIfNotExists: mockCurrentUser } } },
					{ request: { query: StaffRolesForSelectDocument }, result: { data: { staffRoles: mockRolesForSelect } } },
					{ request: { query: StaffRolesForSelectDocument }, result: { data: { staffRoles: mockRolesForSelect } } },
				]}
				addTypename={false}
			>
				<Story />
			</MockedProvider>
		),
	],
	render: () => (
		<StaffAuthProvider value={mockAuth}>
			<MemoryRouter initialEntries={['/staff/user-management/staff-users/1']}>
				<Routes>
					<Route
						path="/staff/user-management"
						element={<SectionLayout />}
					>
						<Route
							path="staff-users/*"
							element={<StaffUsersPage />}
						/>
					</Route>
				</Routes>
			</MemoryRouter>
		</StaffAuthProvider>
	),
};
