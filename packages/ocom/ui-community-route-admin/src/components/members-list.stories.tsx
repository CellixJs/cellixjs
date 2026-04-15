import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../generated.tsx';
import { MemberList } from './members-list.tsx';

const mockMemberData: AdminMemberListContainerMemberFieldsFragment[] = [
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439011',
		memberName: 'John Doe',
		isAdmin: true,
		accounts: [
			{
				__typename: 'MemberAccount',
				id: '507f1f77bcf86cd799439012',
				firstName: 'John',
				lastName: 'Doe',
				statusCode: 'ACCEPTED',
				user: {
					__typename: 'EndUser',
					id: '507f1f77bcf86cd799439013',
					externalId: 'auth0|507f1f77bcf86cd799439013',
				},
				createdAt: '2024-01-01T12:00:00.000Z',
				updatedAt: '2024-01-01T12:00:00.000Z',
			},
		],
		profile: {
			__typename: 'MemberProfile',
			name: 'John Doe',
			email: 'john.doe@example.com',
			bio: 'Community administrator',
			showEmail: true,
			showProfile: true,
		},
		createdAt: '2024-01-01T12:00:00.000Z',
		updatedAt: '2024-01-15T12:00:00.000Z',
	},
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439014',
		memberName: 'Jane Smith',
		isAdmin: false,
		accounts: [
			{
				__typename: 'MemberAccount',
				id: '507f1f77bcf86cd799439015',
				firstName: 'Jane',
				lastName: 'Smith',
				statusCode: 'CREATED',
				user: {
					__typename: 'EndUser',
					id: '507f1f77bcf86cd799439016',
					externalId: 'auth0|507f1f77bcf86cd799439016',
				},
				createdAt: '2024-01-02T12:00:00.000Z',
				updatedAt: '2024-01-02T12:00:00.000Z',
			},
		],
		profile: {
			__typename: 'MemberProfile',
			name: 'Jane Smith',
			email: 'jane.smith@example.com',
			bio: 'New community member',
			showEmail: false,
			showProfile: true,
		},
		createdAt: '2024-01-02T12:00:00.000Z',
		updatedAt: '2024-01-02T12:00:00.000Z',
	},
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439017',
		memberName: 'Bob Johnson',
		isAdmin: false,
		accounts: [
			{
				__typename: 'MemberAccount',
				id: '507f1f77bcf86cd799439018',
				firstName: 'Bob',
				lastName: 'Johnson',
				statusCode: 'ACCEPTED',
				user: {
					__typename: 'EndUser',
					id: '507f1f77bcf86cd799439019',
					externalId: 'auth0|507f1f77bcf86cd799439019',
				},
				createdAt: '2024-01-03T12:00:00.000Z',
				updatedAt: '2024-01-03T12:00:00.000Z',
			},
		],
		profile: {
			__typename: 'MemberProfile',
			name: 'Bob Johnson',
			email: 'bob.johnson@example.com',
			bio: null,
			showEmail: true,
			showProfile: false,
		},
		createdAt: '2024-01-03T12:00:00.000Z',
		updatedAt: '2024-01-03T12:00:00.000Z',
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
		data: mockMemberData,
		onInviteMember: () => console.log('Invite member clicked'),
		onMemberEdit: (memberId) => console.log('Edit member:', memberId),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Verify the member count is displayed
		expect(canvas.getByText('Community Members (3)')).toBeInTheDocument();

		// Verify the invite button is present
		expect(canvas.getByRole('button', { name: /invite member/i })).toBeInTheDocument();
		expect(canvas.getByPlaceholderText(/search by member name or email/i)).toBeInTheDocument();
		expect(canvas.getByText(/all statuses/i)).toBeInTheDocument();

		// Verify member names are displayed in the table
		expect(canvas.getByText('John Doe')).toBeInTheDocument();
		expect(canvas.getByText('Jane Smith')).toBeInTheDocument();
		expect(canvas.getByText('Bob Johnson')).toBeInTheDocument();

		// Verify member status tags are rendered
		expect(canvas.getAllByText('Active').length).toBeGreaterThan(0);
		expect(canvas.getByText('Invited')).toBeInTheDocument();

		// Verify "No Role" is shown for members without roles
		expect(canvas.getAllByText('No Role')).toHaveLength(3);

		// Verify Edit buttons are present for each member
		expect(canvas.getAllByRole('button', { name: /edit/i })).toHaveLength(3);
		expect(canvas.getAllByRole('button', { name: /remove/i })).toHaveLength(3);
	},
};

export const EmptyState: Story = {
	args: {
		data: [],
		onInviteMember: () => console.log('Invite member clicked'),
		onMemberEdit: (memberId) => console.log('Edit member:', memberId),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Verify empty state shows zero members
		expect(canvas.getByText('Community Members (0)')).toBeInTheDocument();

		// Verify invite button is still present
		expect(canvas.getByRole('button', { name: /invite member/i })).toBeInTheDocument();
	},
};

export const SingleMember: Story = {
	args: {
		data: mockMemberData.slice(0, 1),
		onInviteMember: () => console.log('Invite member clicked'),
		onMemberEdit: (memberId) => console.log('Edit member:', memberId),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Verify single member count
		expect(canvas.getByText('Community Members (1)')).toBeInTheDocument();

		// Verify the member is displayed by name
		expect(canvas.getByText('John Doe')).toBeInTheDocument();

		// Verify one Edit button is present
		expect(canvas.getByRole('button', { name: /edit/i })).toBeInTheDocument();
	},
};
