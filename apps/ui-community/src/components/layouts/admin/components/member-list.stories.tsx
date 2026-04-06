import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { expect, userEvent, within } from 'storybook/test';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';
import { MemberList } from './member-list.tsx';

const makeMember = (id: string, name: string, email: string, statusCode: string, isAdmin: boolean, createdAt = '2024-01-15T00:00:00.000Z'): AdminMemberListContainerMemberFieldsFragment => ({
	__typename: 'Member',
	id,
	memberName: name,
	isAdmin,
	createdAt,
	updatedAt: createdAt,
	profile: { __typename: 'MemberProfile', name, email, avatarDocumentId: null },
	accounts: [
		{
			__typename: 'MemberAccount',
			id: `${id}-account`,
			firstName: name.split(' ')[0] ?? name,
			lastName: name.split(' ')[1] ?? null,
			statusCode,
			createdAt,
		},
	],
});

const mockMembers: AdminMemberListContainerMemberFieldsFragment[] = [
	makeMember('m1', 'Alice Johnson', 'alice@example.com', 'active', true),
	makeMember('m2', 'Bob Smith', 'bob@example.com', 'active', false),
	makeMember('m3', 'Carol White', 'carol@example.com', 'inactive', false),
	makeMember('m4', 'David Brown', 'david@example.com', 'active', false),
];

const meta = {
	title: 'Components/Layouts/Admin/MemberList',
	component: MemberList,
	parameters: {
		layout: 'padded',
	},
	args: {
		onAdd: fn(),
		onRemove: fn(),
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
		expect(canvas.getAllByTestId('member-row')).toHaveLength(4);
		expect(canvas.getByTestId('member-search')).toBeInTheDocument();
		expect(canvas.getByTestId('member-add-btn')).toBeInTheDocument();
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText('No members found')).toBeInTheDocument();
	},
};

export const WithSearch: Story = {
	args: {
		data: mockMembers,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const searchInput = canvas.getByTestId('member-search');
		await userEvent.type(searchInput, 'alice');
		expect(canvas.getAllByTestId('member-row')).toHaveLength(1);
	},
};

export const AdminOnly: Story = {
	args: {
		data: [makeMember('m1', 'Admin User', 'admin@example.com', 'active', true)],
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByTestId('member-role')).toHaveTextContent('Admin');
	},
};

export const WithRemoveAction: Story = {
	args: {
		data: mockMembers,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getAllByTestId('member-remove-btn')).toHaveLength(4);
	},
};
