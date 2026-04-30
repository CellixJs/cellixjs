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
			endUserId: 'end-user-1',
		},
		onSave: async () => {
			/* Story handler */
		},
		onRemove: async () => {
			/* Story handler */
		},
		endUsers: [
			{
				__typename: 'EndUser',
				id: 'end-user-1',
				displayName: 'John Doe',
				personalInformation: {
					__typename: 'EndUserPersonalInformation',
					contactInformation: {
						__typename: 'EndUserContactInformation',
						email: 'john@example.com',
					},
				},
			},
		],
		loading: false,
	},
};

export const WithMinimalData: Story = {
	args: {
		data: {
			memberId: 'member-123',
			accountId: 'account-456',
			endUserId: 'end-user-2',
		},
		onSave: async () => {
			/* Story handler */
		},
		onRemove: async () => {
			/* Story handler */
		},
		endUsers: [
			{
				__typename: 'EndUser',
				id: 'end-user-2',
				displayName: 'Jane Smith',
				personalInformation: {
					__typename: 'EndUserPersonalInformation',
					contactInformation: {
						__typename: 'EndUserContactInformation',
						email: 'jane@example.com',
					},
				},
			},
		],
		loading: false,
	},
};
