import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { StaffUserDetail } from './staff-user-detail.tsx';

const mockUser = {
	id: '1',
	displayName: 'Alice Admin',
	email: 'alice@example.com',
	role: { id: 'r1', roleName: 'Tech Admin' },
	createdAt: '2024-01-01T00:00:00Z',
};

const mockRoles = [
	{ id: 'r1', roleName: 'Tech Admin' },
	{ id: 'r2', roleName: 'Case Manager' },
	{ id: 'r3', roleName: 'Finance' },
];

const mockActivityLog = [
	{
		activityType: 'ROLE_ASSIGNED',
		activityDescription: 'Role "Tech Admin" was assigned',
		activityByStaffUserId: 'user-99',
		activityByStaffUserDisplayName: 'Jane Admin',
		createdAt: '2024-03-15T10:00:00Z',
	},
	{
		activityType: 'LOGIN',
		activityDescription: 'User logged in',
		activityByStaffUserId: 'user-1',
		activityByStaffUserDisplayName: 'John Doe',
		createdAt: '2024-03-20T08:30:00Z',
	},
];

const meta: Meta<typeof StaffUserDetail> = {
	title: 'UserManagement/Components/StaffUserDetail',
	component: StaffUserDetail,
	parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof StaffUserDetail>;

export const Default: Story = {
	args: {
		data: mockUser,
		availableRoles: mockRoles,
		canAssignRoles: true,
		selectedRoleId: 'r1',
		activityLog: mockActivityLog,
		onRoleChange: (roleId) => console.log('Role changed:', roleId),
		onSave: () => console.log('Save clicked'),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText('Staff User Details')).toBeInTheDocument();
		expect(canvas.getByText('Alice Admin')).toBeInTheDocument();
		expect(canvas.getByText('Activity Log')).toBeInTheDocument();
		expect(canvas.getByText('ROLE_ASSIGNED')).toBeInTheDocument();
		expect(canvas.getByText('Role "Tech Admin" was assigned')).toBeInTheDocument();
		expect(canvas.getByText('LOGIN')).toBeInTheDocument();
	},
};

export const ReadOnly: Story = {
	args: {
		data: mockUser,
		availableRoles: mockRoles,
		canAssignRoles: false,
		selectedRoleId: 'r1',
		activityLog: mockActivityLog,
		onRoleChange: (roleId) => console.log('Role changed:', roleId),
		onSave: () => console.log('Save clicked'),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText('Activity Log')).toBeInTheDocument();
		expect(canvas.getByText('ROLE_ASSIGNED')).toBeInTheDocument();
	},
};

export const NoRole: Story = {
	args: {
		data: { ...mockUser, role: null },
		availableRoles: mockRoles,
		canAssignRoles: true,
		selectedRoleId: null,
		activityLog: [],
		onRoleChange: (roleId) => console.log('Role changed:', roleId),
		onSave: () => console.log('Save clicked'),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText('Activity Log')).toBeInTheDocument();
		expect(canvas.getByText('No activity recorded')).toBeInTheDocument();
	},
};

export const WithActivityLog: Story = {
	args: {
		data: mockUser,
		availableRoles: mockRoles,
		canAssignRoles: true,
		selectedRoleId: 'r1',
		activityLog: [
			...mockActivityLog,
			{
				activityType: 'PROFILE_UPDATED',
				activityDescription: 'Display name updated',
				activityByStaffUserId: 'user-1',
				activityByStaffUserDisplayName: 'John Doe',
				createdAt: '2024-04-01T12:00:00Z',
			},
		],
		onRoleChange: (roleId) => console.log('Role changed:', roleId),
		onSave: () => console.log('Save clicked'),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText('Activity Log')).toBeInTheDocument();
		expect(canvas.getByText('ROLE_ASSIGNED')).toBeInTheDocument();
		expect(canvas.getByText('LOGIN')).toBeInTheDocument();
		expect(canvas.getByText('PROFILE_UPDATED')).toBeInTheDocument();
		expect(canvas.getByText('Display name updated')).toBeInTheDocument();
	},
};
