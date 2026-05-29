import type { Meta, StoryObj } from '@storybook/react';
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
	canViewDatabaseDocuments: false,
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
			canViewDatabaseDocuments: false,
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
