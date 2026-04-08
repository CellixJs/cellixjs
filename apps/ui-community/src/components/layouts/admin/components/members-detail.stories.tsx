import type { Meta, StoryObj } from '@storybook/react';
import { MembersDetail } from './members-detail.tsx';
import type { AdminMembersDetailContainerMemberFieldsFragment } from '../../../../generated.tsx';

const mockMember: AdminMembersDetailContainerMemberFieldsFragment = {
	__typename: 'Member',
	id: 'member-123',
	memberName: 'John Doe',
	role: {
		__typename: 'EndUserRole',
		id: 'role-123',
		roleName: 'Admin',
	},
	createdAt: '2024-01-01T00:00:00Z',
	updatedAt: '2024-01-02T00:00:00Z',
};

const meta: Meta<typeof MembersDetail> = {
	title: 'Admin/Components/MembersDetail',
	component: MembersDetail,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		data: {
			member: mockMember,
		},
	},
};

export const NoRole: Story = {
	args: {
		data: {
			member: {
				...mockMember,
				role: null,
			},
		},
	},
};

export const MemberRole: Story = {
	args: {
		data: {
			member: {
				...mockMember,
				role: {
					__typename: 'EndUserRole',
					id: 'role-456',
					roleName: 'Member',
				},
			},
		},
	},
};
