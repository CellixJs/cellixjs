import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { StaffRoleCreate } from './staff-role-create.tsx';

const ALL_ENTERPRISE_APP_ROLES = ['Staff.TechAdmin', 'Staff.ServiceLineOwner', 'Staff.CaseManager', 'Staff.Finance'];

const meta: Meta<typeof StaffRoleCreate> = {
	title: 'Components/Staff/User Management/Staff Role Create',
	component: StaffRoleCreate,
	parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof StaffRoleCreate>;

export const Default: Story = {
	args: {
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		availableEnterpriseAppRoles: ALL_ENTERPRISE_APP_ROLES,
		showTechAdminPermissions: true,
	},
};

export const CaseManagerView: Story = {
	args: {
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		availableEnterpriseAppRoles: ['Staff.CaseManager'],
		showTechAdminPermissions: false,
	},
};

export const ServiceLineOwnerView: Story = {
	args: {
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		availableEnterpriseAppRoles: ['Staff.ServiceLineOwner', 'Staff.CaseManager'],
		showTechAdminPermissions: false,
	},
};

export const WithLoading: Story = {
	args: {
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		loading: true,
		availableEnterpriseAppRoles: ALL_ENTERPRISE_APP_ROLES,
		showTechAdminPermissions: true,
	},
};

export const PermissionHierarchy: Story = {
	args: {
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		availableEnterpriseAppRoles: ALL_ENTERPRISE_APP_ROLES,
		showTechAdminPermissions: false,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const addRole = canvas.getByRole('checkbox', { name: /can add staff role/i });
		const viewRoles = canvas.getByRole('checkbox', { name: /can view staff roles/i });

		await userEvent.click(addRole);

		expect(addRole).toBeChecked();
		expect(viewRoles).toBeChecked();
	},
};
