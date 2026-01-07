import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import type { AdminMembersListContainerMemberFieldsFragment } from '../../../../generated.tsx';
import { MembersList } from './members-list.tsx';

const meta: Meta<typeof MembersList> = {
	title: 'Components/Layouts/Admin/MembersList',
	component: MembersList,
	decorators: [
		(Story) => (
			<BrowserRouter>
				<Story />
			</BrowserRouter>
		),
	],
};

export default meta;
type Story = StoryObj<typeof MembersList>;

const mockMembers: AdminMembersListContainerMemberFieldsFragment[] = [
	{
		id: '1',
		memberName: 'John Doe',
		isAdmin: true,
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-15T00:00:00.000Z',
	},
	{
		id: '2',
		memberName: 'Jane Smith',
		isAdmin: false,
		createdAt: '2024-01-05T00:00:00.000Z',
		updatedAt: '2024-01-20T00:00:00.000Z',
	},
	{
		id: '3',
		memberName: 'Bob Johnson',
		isAdmin: true,
		createdAt: '2024-01-10T00:00:00.000Z',
		updatedAt: '2024-01-25T00:00:00.000Z',
	},
];

export const Default: Story = {
	args: {
		data: mockMembers,
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
};

export const SingleMember: Story = {
	args: {
		data: mockMembers.slice(0, 1),
	},
};
