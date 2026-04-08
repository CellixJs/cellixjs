import type { Meta, StoryObj } from '@storybook/react';
import { MembersAccountsEdit } from './members-accounts-edit.tsx';

const meta: Meta<typeof MembersAccountsEdit> = {
	title: 'Admin/Components/MembersAccountsEdit',
	component: MembersAccountsEdit,
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
			accountId: 'account-456',
			firstName: 'John',
			lastName: 'Doe',
		},
		onSave: async () => {
			/* Story handler */
		},
		onRemove: async () => {
			/* Story handler */
		},
	},
};

export const WithMinimalData: Story = {
	args: {
		data: {
			memberId: 'member-123',
			accountId: 'account-456',
			firstName: 'Jane',
			lastName: '',
		},
		onSave: async () => {
			/* Story handler */
		},
		onRemove: async () => {
			/* Story handler */
		},
	},
};
