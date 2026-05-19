import type { Meta, StoryObj } from '@storybook/react';
import { StaffUserCreate } from './staff-user-create.tsx';

const roles = [
	{ id: 'r1', roleName: 'Tech Admin' },
	{ id: 'r2', roleName: 'Case Manager' },
	{ id: 'r3', roleName: 'Finance' },
];

const meta: Meta<typeof StaffUserCreate> = {
	title: 'UserManagement/Components/StaffUserCreate',
	component: StaffUserCreate,
	parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof StaffUserCreate>;

export const Default: Story = {
	args: {
		availableRoles: roles,
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
	},
};

export const WithLoading: Story = {
	args: {
		availableRoles: roles,
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		loading: true,
	},
};
