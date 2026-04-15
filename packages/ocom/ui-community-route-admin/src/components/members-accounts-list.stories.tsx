import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import type { AdminMembersAccountsListContainerMemberAccountFieldsFragment } from '../../../../generated.tsx';
import { MembersAccountsList } from './members-accounts-list.tsx';

const meta: Meta<typeof MembersAccountsList> = {
	title: 'Admin/Components/MembersAccountsList',
	component: MembersAccountsList,
	decorators: [
		(Story) => (
			<MemoryRouter>
				<Story />
			</MemoryRouter>
		),
	],
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockAccountData: AdminMembersAccountsListContainerMemberAccountFieldsFragment[] = [
	{
		id: '1',
		firstName: 'John',
		lastName: 'Doe',
		statusCode: 'Active',
		user: {
			id: 'user-1',
			personalInformation: {
				contactInformation: {
					email: 'john.doe@example.com',
				},
			},
		},
		createdAt: new Date('2023-01-15'),
		updatedAt: new Date('2023-06-15'),
	},
	{
		id: '2',
		firstName: 'Jane',
		lastName: 'Smith',
		statusCode: 'Inactive',
		user: {
			id: 'user-2',
			personalInformation: {
				contactInformation: {
					email: 'jane.smith@example.com',
				},
			},
		},
		createdAt: new Date('2023-02-20'),
		updatedAt: new Date('2023-05-10'),
	},
];

export const Default: Story = {
	args: {
		data: mockAccountData,
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
};
