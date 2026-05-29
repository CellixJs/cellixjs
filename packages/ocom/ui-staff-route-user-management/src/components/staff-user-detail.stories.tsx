import type { Meta, StoryObj } from '@storybook/react';
import { StaffUserDetail } from './staff-user-detail.tsx';

const mockUser = {
	id: '1',
	displayName: 'Alice Admin',
	email: 'alice@example.com',
	role: { id: 'r1', roleName: 'Tech Admin' },
	createdAt: '2024-01-01T00:00:00Z',
};

const mockRoles = [
	{ id: 'r1', roleName: 'Tech Admin' },
	{ id: 'r2', roleName: 'Case Manager' },
	{ id: 'r3', roleName: 'Finance' },
];

const meta: Meta<typeof StaffUserDetail> = {
	title: 'UserManagement/Components/StaffUserDetail',
	component: StaffUserDetail,
	parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof StaffUserDetail>;

export const Default: Story = {
	args: {
		data: mockUser,
		availableRoles: mockRoles,
		canAssignRoles: true,
		onRoleChange: (roleId) => console.log('Role changed:', roleId),
		onSave: () => console.log('Save clicked'),
	},
};

export const ReadOnly: Story = {
	args: {
		data: mockUser,
		availableRoles: mockRoles,
		canAssignRoles: false,
		onRoleChange: (roleId) => console.log('Role changed:', roleId),
		onSave: () => console.log('Save clicked'),
	},
};

export const NoRole: Story = {
	args: {
		data: { ...mockUser, role: null },
		availableRoles: mockRoles,
		canAssignRoles: true,
		onRoleChange: (roleId) => console.log('Role changed:', roleId),
		onSave: () => console.log('Save clicked'),
	},
};
