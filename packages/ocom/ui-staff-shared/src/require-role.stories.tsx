import type { Meta, StoryObj } from '@storybook/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireRoleStaffUserCurrentDocument } from './generated.tsx';
import { expect, within } from 'storybook/test';
import { RequireRole, type RequireRoleProps } from './require-role.tsx';

const protectedPermissions = {
	__typename: 'StaffRolePermissions',
	communityPermissions: { __typename: 'StaffRoleCommunityPermissions', canManageCommunities: false, canManageStaffRolesAndPermissions: false },
	userPermissions: { __typename: 'StaffRoleUserPermissions', canManageUsers: false, canAssignStaffRoles: false, canViewStaffUsers: false },
	staffRolePermissions: { __typename: 'StaffRoleRolePermissions', canViewRoles: false, canAddRole: false, canEditRole: false, canRemoveRole: false },
	financePermissions: {
		__typename: 'StaffRoleFinancePermissions',
		canManageFinance: false,
		canViewGLBatchSummaries: false,
		canViewFinanceConfigs: false,
		canCreateFinanceConfigs: false,
	},
	techAdminPermissions: {
		__typename: 'StaffRoleTechAdminPermissions',
		canManageTechAdmin: true,
		canViewDatabaseExplorer: false,
		canViewBlobExplorer: false,
		canViewQueueDashboard: false,
		canSendQueueMessages: false,
	},
};

const deniedPermissions = {
	__typename: 'StaffRolePermissions',
	communityPermissions: { __typename: 'StaffRoleCommunityPermissions', canManageCommunities: false, canManageStaffRolesAndPermissions: false },
	userPermissions: { __typename: 'StaffRoleUserPermissions', canManageUsers: false, canAssignStaffRoles: false, canViewStaffUsers: false },
	staffRolePermissions: { __typename: 'StaffRoleRolePermissions', canViewRoles: false, canAddRole: false, canEditRole: false, canRemoveRole: false },
	financePermissions: {
		__typename: 'StaffRoleFinancePermissions',
		canManageFinance: false,
		canViewGLBatchSummaries: false,
		canViewFinanceConfigs: false,
		canCreateFinanceConfigs: false,
	},
	techAdminPermissions: {
		__typename: 'StaffRoleTechAdminPermissions',
		canManageTechAdmin: false,
		canViewDatabaseExplorer: false,
		canViewBlobExplorer: false,
		canViewQueueDashboard: false,
		canSendQueueMessages: false,
	},
};

const meta = {
	title: 'Components/Staff/Require Role',
	component: RequireRole,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof RequireRole>;

export default meta;
type Story = StoryObj<typeof RequireRole>;

const ProtectedContent = () => <div>protected content</div>;

const routeWrapper = (story: ReactElement) => (
	<Routes>
		<Route
			path="/staff/tech"
			element={story}
		/>
		<Route
			path="/unauthorized"
			element={<div>unauthorized</div>}
		/>
	</Routes>
);

export const Authorized: Story = {
	args: {
		roles: [],
		permKey: 'canManageTechAdmin',
		children: <ProtectedContent />,
	} satisfies RequireRoleProps,
	parameters: {
		memoryRouter: {
			initialEntries: ['/staff/tech'],
		},
		apolloClient: {
			mocks: [
				{
					request: {
						query: RequireRoleStaffUserCurrentDocument,
						variables: {},
					},
					result: {
						data: {
							staffUserCurrent: {
								__typename: 'StaffUser',
								role: {
									__typename: 'StaffRole',
									permissions: protectedPermissions,
								},
							},
						},
					},
				},
			],
		},
	},
	decorators: [
		(Story) => <MemoryRouter initialEntries={['/staff/tech']}>{routeWrapper(<Story />)}</MemoryRouter>,
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(canvas.findByText('protected content')).resolves.toBeInTheDocument();
		expect(canvas.queryByText('unauthorized')).not.toBeInTheDocument();
	},
};

export const Unauthorized: Story = {
	args: {
		roles: [],
		permKey: 'canManageTechAdmin',
		children: <ProtectedContent />,
	} satisfies RequireRoleProps,
	parameters: {
		memoryRouter: {
			initialEntries: ['/staff/tech'],
		},
		apolloClient: {
			mocks: [
				{
					request: {
						query: RequireRoleStaffUserCurrentDocument,
						variables: {},
					},
					result: {
						data: {
							staffUserCurrent: {
								__typename: 'StaffUser',
								role: {
									__typename: 'StaffRole',
									permissions: deniedPermissions,
								},
							},
						},
					},
				},
			],
		},
	},
	decorators: [
		(Story) => <MemoryRouter initialEntries={['/staff/tech']}>{routeWrapper(<Story />)}</MemoryRouter>,
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(canvas.findByText('unauthorized')).resolves.toBeInTheDocument();
		expect(canvas.queryByText('protected content')).not.toBeInTheDocument();
	},
};
