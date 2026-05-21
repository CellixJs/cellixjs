import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { type StaffUser, StaffUsersList } from './staff-users-list.tsx';

const mockUsers: StaffUser[] = [
	{
		id: '1',
		displayName: 'Alice Admin',
		email: 'alice@example.com',
		role: { id: 'r1', roleName: 'Tech Admin' },
		createdAt: '2024-01-01T00:00:00Z',
	},
	{
		id: '2',
		displayName: 'Bob Manager',
		email: 'bob@example.com',
		role: null,
		createdAt: '2024-02-01T00:00:00Z',
	},
];

const meta: Meta<typeof StaffUsersList> = {
	title: 'UserManagement/Components/StaffUsersList',
	component: StaffUsersList,
	parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof StaffUsersList>;

export const Default: Story = {
	args: {
		data: mockUsers,
		onEdit: (id) => console.log('Edit user:', id),
		onCreate: () => console.log('Create staff user clicked'),
		canCreate: true,
		canEdit: true,
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText('Staff Users (2)')).toBeInTheDocument();
		expect(canvas.getByText('Alice Admin')).toBeInTheDocument();
		expect(canvas.getByText('Bob Manager')).toBeInTheDocument();
		expect(canvas.getByText('Tech Admin')).toBeInTheDocument();
		expect(canvas.getByText('No Role')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /create staff user/i })).toBeInTheDocument();
	},
};

export const EmptyState: Story = {
	args: {
		data: [],
		onEdit: (id) => console.log('Edit user:', id),
		onCreate: () => console.log('Create staff user clicked'),
		canCreate: true,
		canEdit: true,
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText('Staff Users (0)')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /create staff user/i })).toBeInTheDocument();
	},
};
