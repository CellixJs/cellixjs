import type { Meta, StoryObj } from '@storybook/react';
import { StaffRoleCreate } from './staff-role-create.tsx';

const meta: Meta<typeof StaffRoleCreate> = {
	title: 'UserManagement/Components/StaffRoleCreate',
	component: StaffRoleCreate,
	parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof StaffRoleCreate>;

export const Default: Story = {
	args: {
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
	},
};

export const WithLoading: Story = {
	args: {
		onSubmit: (values) => console.log('Submit:', values),
		onCancel: () => console.log('Cancel clicked'),
		loading: true,
	},
};
