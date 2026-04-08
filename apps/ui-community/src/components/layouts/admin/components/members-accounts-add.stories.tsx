import type { Meta, StoryObj } from '@storybook/react';
import { MembersAccountsAdd } from './members-accounts-add.tsx';

const meta: Meta<typeof MembersAccountsAdd> = {
	title: 'Admin/Components/MembersAccountsAdd',
	component: MembersAccountsAdd,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		data: {
			memberId: 'member-123',
			firstName: '',
			lastName: '',
		},
		onSave: async () => {
			/* Story handler */
		},
	},
};

export const WithInitialData: Story = {
	args: {
		data: {
			memberId: 'member-123',
			firstName: 'John',
			lastName: 'Doe',
		},
		onSave: async () => {
			/* Story handler */
		},
	},
};
