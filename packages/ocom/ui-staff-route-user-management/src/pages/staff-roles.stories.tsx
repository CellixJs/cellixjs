import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react';
import { StaffAuthProvider } from '@ocom/ui-staff-shared';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StaffRoleByIdDocument, StaffRoleCreateDocument, StaffRolesListDocument, StaffRoleUpdateDocument } from '../generated.tsx';
import { SectionLayout } from '../section-layout.tsx';
import { StaffRolesPage } from './staff-roles.tsx';

const mockStaffRoles = [
	{ 
        __typename: 'StaffRole',
        id: 'r1', roleName: 'Case Manager', 
        enterpriseAppRole: 'Staff.CaseManager', 
        createdAt: '2024-01-01T00:00:00.000Z', 
        updatedAt: '2024-01-15T00:00:00.000Z' 
    },
	{   
        __typename: 'StaffRole',
         id: 'r2', 
         roleName: 'Finance', 
         enterpriseAppRole: 'Staff.Finance', 
         createdAt: '2024-01-02T00:00:00.000Z', 
         updatedAt: '2024-01-15T00:00:00.000Z' 
    },
];

const mockRoleDetail = {
	id: 'r1',
	roleName: 'Case Manager',
	enterpriseAppRole: 'Staff.CaseManager',
	permissions: {
		communityPermissions: {
			canManageCommunities: false,
			canManageStaffRolesAndPermissions: false,
			canManageAllCommunities: false,
			canDeleteCommunities: false,
			canChangeCommunityOwner: false,
			canReIndexSearchCollections: false,
		},
		userPermissions: {
			canManageUsers: true,
			canAssignStaffRoles: true,
			canViewStaffUsers: true,
		},
		staffRolePermissions: {
			canViewRoles: true,
			canAddRole: false,
			canEditRole: false,
			canRemoveRole: false,
		},
		financePermissions: {
			canManageFinance: false,
			canViewGLBatchSummaries: false,
			canViewFinanceConfigs: false,
			canCreateFinanceConfigs: false,
		},
		techAdminPermissions: {
			canManageTechAdmin: false,
			canViewDatabaseExplorer: false,
			canViewBlobExplorer: false,
			canViewQueueDashboard: false,
			canSendQueueMessages: false,
		},
	},
};

const listMock = {
	request: { query: StaffRolesListDocument },
	result: { data: { staffRoles: mockStaffRoles } },
};

const createMock = {
	request: { query: StaffRoleCreateDocument, variables: { input: { roleName: 'New Role', enterpriseAppRole: '' } } },
	result: { data: { staffRoleCreate: { status: { success: true, errorMessage: null }, staffRole: { id: 'r3', roleName: 'New Role', enterpriseAppRole: '' } } } },
};

const editMock = {
	request: { query: StaffRoleByIdDocument, variables: { id: 'r1' } },
	result: { data: { staffRoleById: mockRoleDetail } },
};

const updateMock = {
	request: { query: StaffRoleUpdateDocument, variables: { input: { id: 'r1', roleName: 'Case Manager Updated' } } },
	result: { data: { staffRoleUpdate: { status: { success: true, errorMessage: null }, staffRole: { id: 'r1', roleName: 'Case Manager Updated', enterpriseAppRole: 'Staff.CaseManager' } } } },
};

const mockAuth = {
	name: 'Admin User',
	permissions: {
		canViewRoles: true,
		canAddRole: true,
		canEditRole: true,
		canManageTechAdmin: true,
	},
};

const meta: Meta<typeof StaffRolesPage> = {
	title: 'Pages/Staff/User Management/Staff Roles',
	component: StaffRolesPage,
	parameters: {
		layout: 'fullscreen',
	},
};

export default meta;
type Story = StoryObj<typeof StaffRolesPage>;

export const Default: Story = {
	parameters: {
		apolloClient: { mocks: [listMock, createMock] },
	},
	render: () => (
		<StaffAuthProvider value={mockAuth}>
			<MemoryRouter initialEntries={['/staff/user-management/staff-roles']}>
				<Routes>
					<Route
						path="/staff/user-management"
						element={<SectionLayout />}
					>
						<Route
							path="staff-roles/*"
							element={<StaffRolesPage />}
						/>
					</Route>
				</Routes>
			</MemoryRouter>
		</StaffAuthProvider>
	),
};

export const CreateView: Story = {
	parameters: {
		apolloClient: { mocks: [listMock, createMock] },
	},
	render: () => (
		<StaffAuthProvider value={mockAuth}>
			<MemoryRouter initialEntries={['/staff/user-management/staff-roles/create']}>
				<Routes>
					<Route
						path="/staff/user-management"
						element={<SectionLayout />}
					>
						<Route
							path="staff-roles/*"
							element={<StaffRolesPage />}
						/>
					</Route>
				</Routes>
			</MemoryRouter>
		</StaffAuthProvider>
	),
};

export const EditView: Story = {
	decorators: [
		(Story) => (
			<MockedProvider
				mocks={[editMock, editMock, updateMock]}
				addTypename={false}
			>
				<Story />
			</MockedProvider>
		),
	],
	render: () => (
		<StaffAuthProvider value={mockAuth}>
			<MemoryRouter initialEntries={['/staff/user-management/staff-roles/edit/r1']}>
				<Routes>
					<Route
						path="/staff/user-management"
						element={<SectionLayout />}
					>
						<Route
							path="staff-roles/*"
							element={<StaffRolesPage />}
						/>
					</Route>
				</Routes>
			</MemoryRouter>
		</StaffAuthProvider>
	),
};
