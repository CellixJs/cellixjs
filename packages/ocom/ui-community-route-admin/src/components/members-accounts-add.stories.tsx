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
			endUserId: '',
		},
		onSave: async () => {
			/* Story handler */
		},
		endUsers: [
			{
				__typename: 'EndUser',
				id: 'end-user-1',
				displayName: 'Jane Doe',
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

export const WithInitialData: Story = {
	args: {
		data: {
			memberId: 'member-123',
			endUserId: 'end-user-1',
		},
		onSave: async () => {
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
