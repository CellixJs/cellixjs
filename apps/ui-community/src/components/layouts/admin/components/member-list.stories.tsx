import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';
import { MemberList } from './member-list.tsx';

const mockMembers: AdminMemberListContainerMemberFieldsFragment[] = [
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439011',
		memberName: 'johndoe',
		isAdmin: true,
		accounts: [
			{
				__typename: 'MemberAccount',
				id: 'acc-001',
				firstName: 'John',
				lastName: 'Doe',
				statusCode: 'ACCEPTED',
			},
		],
	},
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439012',
		memberName: 'janesmit',
		isAdmin: false,
		accounts: [
			{
				__typename: 'MemberAccount',
				id: 'acc-002',
				firstName: 'Jane',
				lastName: 'Smith',
				statusCode: 'ACCEPTED',
			},
		],
	},
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439013',
		memberName: 'bobwilson',
		isAdmin: false,
		accounts: [
			{
				__typename: 'MemberAccount',
				id: 'acc-003',
				firstName: 'Bob',
				lastName: 'Wilson',
				statusCode: 'CREATED',
			},
		],
	},
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439014',
		memberName: 'anonuser',
		isAdmin: false,
		accounts: [
			{
				__typename: 'MemberAccount',
				id: 'acc-004',
				firstName: 'Anonymous',
				lastName: 'User',
				statusCode: 'REJECTED',
			},
		],
	},
];

const meta = {
	title: 'Components/Layouts/Admin/MemberList',
	component: MemberList,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof MemberList>;

export default meta;
type Story = StoryObj<typeof MemberList>;

export const Default: Story = {
	args: {
		data: mockMembers,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByTestId('member-search')).toBeInTheDocument();
		expect(canvas.getByTestId('member-table')).toBeInTheDocument();
		expect(canvas.getByTestId('admin-tag')).toBeInTheDocument();
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByTestId('member-search')).toBeInTheDocument();
		expect(canvas.getByTestId('member-table')).toBeInTheDocument();
	},
};

export const WithSearch: Story = {
	args: {
		data: mockMembers,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const searchInput = canvas.getByTestId('member-search');
		await userEvent.type(searchInput, 'John');

		expect(canvas.getByTestId(`member-name-${mockMembers[0]?.id}`)).toBeInTheDocument();
	},
};

export const AdminsOnly: Story = {
	args: {
		data: mockMembers.filter((m) => m.isAdmin),
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getAllByTestId('admin-tag')).toHaveLength(1);
	},
};
