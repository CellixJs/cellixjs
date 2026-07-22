import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { StaffRoleCreate } from './staff-role-create.tsx';

const ALL_ENTERPRISE_APP_ROLES = ['Staff.TechAdmin', 'Staff.ServiceLineOwner', 'Staff.CaseManager', 'Staff.Finance'];

const existingRoleValues = {
	roleName: 'Senior Analyst',
	enterpriseAppRole: 'Staff.Finance',
	canManageCommunities: false,
	canManageStaffRolesAndPermissions: false,
	canManageAllCommunities: false,
	canDeleteCommunities: false,
	canChangeCommunityOwner: false,
	canReIndexSearchCollections: false,
	canManageUsers: false,
	canAssignStaffRoles: true,
	canViewStaffUsers: true,
	canViewRoles: true,
	canAddRole: false,
	canEditRole: false,
	canRemoveRole: false,
	canManageFinance: true,
	canViewGLBatchSummaries: false,
	canViewFinanceConfigs: false,
	canCreateFinanceConfigs: false,
	canManageTechAdmin: false,
	canViewDatabaseExplorer: false,
	canViewBlobExplorer: false,
	canViewQueueDashboard: false,
	canSendQueueMessages: false,
};

const meta: Meta<typeof StaffRoleCreate> = {
	title: 'UserManagement/Components/StaffRoleEdit',
	component: StaffRoleCreate,
	parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof StaffRoleCreate>;

export const Default: Story = {
	args: {
		mode: 'edit',
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		availableEnterpriseAppRoles: ALL_ENTERPRISE_APP_ROLES,
		showTechAdminPermissions: true,
		initialValues: existingRoleValues,
	},
};

export const CaseManagerEditView: Story = {
	args: {
		mode: 'edit',
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		availableEnterpriseAppRoles: ['Staff.CaseManager'],
		showTechAdminPermissions: false,
		initialValues: {
			roleName: 'Field Case Manager',
			enterpriseAppRole: 'Staff.CaseManager',
			canManageCommunities: true,
			canManageStaffRolesAndPermissions: true,
			canManageAllCommunities: false,
			canDeleteCommunities: false,
			canChangeCommunityOwner: false,
			canReIndexSearchCollections: false,
			canManageUsers: false,
			canAssignStaffRoles: false,
			canViewStaffUsers: true,
			canViewRoles: true,
			canAddRole: false,
			canEditRole: false,
			canRemoveRole: false,
			canManageFinance: false,
			canViewGLBatchSummaries: false,
			canViewFinanceConfigs: false,
			canCreateFinanceConfigs: false,
			canManageTechAdmin: false,
			canViewDatabaseExplorer: false,
			canViewBlobExplorer: false,
			canViewQueueDashboard: false,
			canSendQueueMessages: false,
		},
	},
};

export const WithSaving: Story = {
	args: {
		mode: 'edit',
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		loading: true,
		availableEnterpriseAppRoles: ALL_ENTERPRISE_APP_ROLES,
		showTechAdminPermissions: true,
		initialValues: existingRoleValues,
	},
};

/** Non-default role viewed by a staff user with the remove-role permission: the delete action is available. */
export const DeletableRole: Story = {
	args: {
		mode: 'edit',
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		availableEnterpriseAppRoles: ALL_ENTERPRISE_APP_ROLES,
		showTechAdminPermissions: true,
		initialValues: existingRoleValues,
		showDelete: true,
		onDelete: () => console.log('Delete confirmed'),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const deleteButton = await canvas.findByRole('button', { name: /delete role/i });
		expect(deleteButton).toBeVisible();
	},
};

/** Default roles are never deletable, so the container hides the delete action (`showDelete: false`). */
export const DefaultRoleDeletionUnavailable: Story = {
	args: {
		mode: 'edit',
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		availableEnterpriseAppRoles: ALL_ENTERPRISE_APP_ROLES,
		showTechAdminPermissions: true,
		initialValues: { ...existingRoleValues, roleName: 'Default Finance' },
		showDelete: false,
		onDelete: () => console.log('Delete confirmed'),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => {
			expect(canvas.queryByRole('button', { name: /delete role/i })).toBeNull();
		});
	},
};

/** Viewer lacks `staffRolePermissions.canRemoveRole`, so the container hides the delete action (`showDelete: false`). */
export const WithoutRemoveRolePermission: Story = {
	args: {
		mode: 'edit',
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		availableEnterpriseAppRoles: ALL_ENTERPRISE_APP_ROLES,
		showTechAdminPermissions: true,
		initialValues: existingRoleValues,
		showDelete: false,
		onDelete: () => console.log('Delete confirmed'),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => {
			expect(canvas.queryByRole('button', { name: /delete role/i })).toBeNull();
		});
	},
};

/** Clicking the delete action opens a confirmation explaining staff-user reassignment to the matching default role. */
export const DeleteConfirmation: Story = {
	args: {
		mode: 'edit',
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		availableEnterpriseAppRoles: ALL_ENTERPRISE_APP_ROLES,
		showTechAdminPermissions: true,
		initialValues: existingRoleValues,
		showDelete: true,
		onDelete: () => console.log('Delete confirmed'),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const deleteButton = await canvas.findByRole('button', { name: /delete role/i });
		await userEvent.click(deleteButton);

		await waitFor(() => {
			const confirmation = canvasElement.querySelector('.ant-popconfirm');
			expect(confirmation).not.toBeNull();
			expect(confirmation?.textContent).toMatch(/reassigned/i);
			expect(confirmation?.textContent).toMatch(/default role/i);
		});
	},
};

/** Deletion mutation in flight: the delete action shows a loading state. */
export const DeletionInProgress: Story = {
	args: {
		mode: 'edit',
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		availableEnterpriseAppRoles: ALL_ENTERPRISE_APP_ROLES,
		showTechAdminPermissions: true,
		initialValues: existingRoleValues,
		showDelete: true,
		onDelete: () => console.log('Delete confirmed'),
		deleting: true,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const deleteButton = await canvas.findByRole('button', { name: /delete role/i });
		expect(deleteButton.className).toContain('ant-btn-loading');
	},
};
