import { StaffAuthContext } from '@ocom/ui-staff-shared';
import type { Meta, StoryObj } from '@storybook/react';
import { App as AntdApp } from 'antd';
import { Route, Routes } from 'react-router-dom';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { StaffRoleByIdDocument, StaffRoleDeleteDocument, StaffRolesListDocument } from '../generated.tsx';
import { StaffRoleEditContainer } from './staff-role-edit.container.tsx';

const ROLE_ID = '607f1f77bcf86cd799439011';

const editableRole = {
	__typename: 'StaffRole' as const,
	id: ROLE_ID,
	roleName: 'Senior Analyst',
	isDefault: false,
	enterpriseAppRole: 'Staff.TechAdmin',
	permissions: {
		__typename: 'StaffRolePermissions' as const,
		communityPermissions: {
			__typename: 'StaffRoleCommunityPermissions' as const,
			canManageCommunities: false,
			canManageStaffRolesAndPermissions: false,
			canManageAllCommunities: false,
			canDeleteCommunities: false,
			canChangeCommunityOwner: false,
			canReIndexSearchCollections: false,
		},
		userPermissions: {
			__typename: 'StaffRoleUserPermissions' as const,
			canManageUsers: false,
			canAssignStaffRoles: true,
			canViewStaffUsers: true,
		},
		staffRolePermissions: {
			__typename: 'StaffRoleRolePermissions' as const,
			canViewRoles: true,
			canAddRole: false,
			canEditRole: false,
			canRemoveRole: false,
		},
		financePermissions: {
			__typename: 'StaffRoleFinancePermissions' as const,
			canManageFinance: true,
			canViewGLBatchSummaries: false,
			canViewFinanceConfigs: false,
			canCreateFinanceConfigs: false,
		},
		techAdminPermissions: {
			__typename: 'StaffRoleTechAdminPermissions' as const,
			canManageTechAdmin: false,
			canViewDatabaseExplorer: false,
			canViewBlobExplorer: false,
			canViewQueueDashboard: false,
			canSendQueueMessages: false,
		},
	},
};

const techAdminAuth = {
	name: 'Tech Admin',
	enterpriseAppRole: 'Staff.TechAdmin',
	permissions: {
		canManageTechAdmin: true,
		canViewRoles: true,
		canAddRole: true,
		canEditRole: true,
		canRemoveRole: true,
	},
};

const staffRoleByIdMock = {
	request: { query: StaffRoleByIdDocument, variables: { id: ROLE_ID } },
	result: { data: { staffRoleById: editableRole } },
};

const staffRolesListMock = {
	request: { query: StaffRolesListDocument },
	result: {
		data: {
			staffRoles: [
				{
					__typename: 'StaffRole' as const,
					id: ROLE_ID,
					roleName: 'Senior Analyst',
					enterpriseAppRole: 'Staff.TechAdmin',
					createdAt: '2024-01-01T00:00:00Z',
					updatedAt: '2024-01-01T00:00:00Z',
				},
			],
		},
	},
	maxUsageCount: Number.POSITIVE_INFINITY,
};

const meta: Meta<typeof StaffRoleEditContainer> = {
	title: 'UserManagement/Containers/StaffRoleEditContainer',
	component: StaffRoleEditContainer,
	parameters: { layout: 'padded' },
	decorators: [
		(Story) => (
			<StaffAuthContext.Provider value={techAdminAuth}>
				<AntdApp>
					<Routes>
						<Route
							path="/roles"
							element={<div>Staff Roles List</div>}
						/>
						<Route
							path="/roles/edit/:id"
							element={<Story />}
						/>
					</Routes>
				</AntdApp>
			</StaffAuthContext.Provider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof StaffRoleEditContainer>;

/** Deleting the role fails server-side: an error message is shown and the user stays on the details page. */
export const DeleteFailure: Story = {
	parameters: {
		memoryRouter: { initialEntries: [`/roles/edit/${ROLE_ID}`] },
		apolloMocks: [
			staffRoleByIdMock,
			staffRolesListMock,
			{
				request: { query: StaffRoleDeleteDocument, variables: { input: { id: ROLE_ID } } },
				result: {
					data: {
						staffRoleDelete: {
							__typename: 'StaffRoleDeleteMutationResult' as const,
							status: { __typename: 'MutationStatus' as const, success: false, errorMessage: 'Deletion rejected by the server' },
						},
					},
				},
			},
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const deleteButton = await canvas.findByRole('button', { name: /delete role/i });
		await userEvent.click(deleteButton);

		await waitFor(() => {
			expect(canvasElement.querySelector('.ant-popconfirm')).not.toBeNull();
		});
		const confirmButton = canvasElement.querySelector<HTMLButtonElement>('.ant-popconfirm-buttons .ant-btn-primary');
		expect(confirmButton).not.toBeNull();
		await userEvent.click(confirmButton as HTMLButtonElement);

		await waitFor(() => {
			expect(document.body.textContent).toMatch(/Failed to delete role/i);
		});
		expect(await canvas.findByRole('button', { name: /delete role/i })).toBeVisible();
	},
};
