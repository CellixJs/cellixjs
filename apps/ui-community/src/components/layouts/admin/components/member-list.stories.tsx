import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';
import { MemberList } from './member-list.tsx';

const mockMembers: AdminMemberListContainerMemberFieldsFragment[] = [
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439011',
		memberName: 'Smith Residence',
		isAdmin: true,
		accounts: [
			{
				__typename: 'MemberAccount',
				id: 'acc-001',
				firstName: 'John',
				lastName: 'Smith',
				statusCode: 'ACCEPTED',
				createdAt: '2024-01-10T12:00:00.000Z',
			},
		],
		profile: {
			__typename: 'MemberProfile',
			email: 'john.smith@example.com',
			avatarDocumentId: null,
		},
	},
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439012',
		memberName: 'Johnson Residence',
		isAdmin: false,
		accounts: [
			{
				__typename: 'MemberAccount',
				id: 'acc-002',
				firstName: 'Jane',
				lastName: 'Johnson',
				statusCode: 'CREATED',
				createdAt: '2024-02-15T12:00:00.000Z',
			},
		],
		profile: {
			__typename: 'MemberProfile',
			email: 'jane.johnson@example.com',
			avatarDocumentId: null,
		},
	},
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439013',
		memberName: 'Williams Residence',
		isAdmin: false,
		accounts: [
			{
				__typename: 'MemberAccount',
				id: 'acc-003',
				firstName: 'Bob',
				lastName: 'Williams',
				statusCode: 'REJECTED',
				createdAt: '2024-03-01T12:00:00.000Z',
			},
		],
		profile: {
			__typename: 'MemberProfile',
			email: null,
			avatarDocumentId: null,
		},
	},
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439014',
		memberName: 'Davis Residence',
		isAdmin: false,
		accounts: [
			{
				__typename: 'MemberAccount',
				id: 'acc-004',
				firstName: 'Alice',
				lastName: 'Davis',
				statusCode: 'ACCEPTED',
				createdAt: '2024-01-20T12:00:00.000Z',
			},
			{
				__typename: 'MemberAccount',
				id: 'acc-005',
				firstName: 'Tom',
				lastName: 'Davis',
				statusCode: 'ACCEPTED',
				createdAt: '2024-01-20T12:00:00.000Z',
			},
		],
		profile: {
			__typename: 'MemberProfile',
			email: 'alice.davis@example.com',
			avatarDocumentId: null,
		},
	},
];

const meta = {
	title: 'Components/Layouts/Admin/MemberList',
	component: MemberList,
	parameters: {
		layout: 'padded',
	},
	argTypes: {
		onSearchChange: { action: 'onSearchChange' },
	},
} satisfies Meta<typeof MemberList>;

export default meta;
type Story = StoryObj<typeof MemberList>;

export const Default: Story = {
	args: {
		data: mockMembers,
		searchValue: '',
		onSearchChange: fn(),
	},
};

export const WithSearch: Story = {
	args: {
		data: mockMembers,
		searchValue: 'smith',
		onSearchChange: fn(),
	},
};

export const Empty: Story = {
	args: {
		data: [],
		searchValue: '',
		onSearchChange: fn(),
	},
};

export const NoResults: Story = {
	args: {
		data: mockMembers,
		searchValue: 'zzz-no-match',
		onSearchChange: fn(),
	},
};
