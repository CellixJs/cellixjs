import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { type StaffRole, StaffRolesList } from './staff-roles-list.tsx';

const mockRoles: StaffRole[] = [
	{
		id: '1',
		roleName: 'Tech Admin',
		enterpriseAppRole: 'Staff.TechAdmin',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-10T00:00:00Z',
	},
	{
		id: '2',
		roleName: 'Case Manager',
		enterpriseAppRole: 'Staff.CaseManager',
		createdAt: '2024-02-01T00:00:00Z',
		updatedAt: '2024-02-15T00:00:00Z',
	},
];

const meta: Meta<typeof StaffRolesList> = {
	title: 'UserManagement/Components/StaffRolesList',
	component: StaffRolesList,
	parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof StaffRolesList>;

export const Default: Story = {
	args: {
		data: mockRoles,
		onEdit: (id) => console.log('Edit role:', id),
		onCreate: () => console.log('Create role clicked'),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText('Staff Roles (2)')).toBeInTheDocument();
		expect(canvas.getByText('Tech Admin')).toBeInTheDocument();
		expect(canvas.getByText('Case Manager')).toBeInTheDocument();
		expect(canvas.getByText('Staff.TechAdmin')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /create staff role/i })).toBeInTheDocument();
	},
};

export const EmptyState: Story = {
	args: {
		data: [],
		onEdit: (id) => console.log('Edit role:', id),
		onCreate: () => console.log('Create role clicked'),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText('Staff Roles (0)')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /create staff role/i })).toBeInTheDocument();
	},
};
