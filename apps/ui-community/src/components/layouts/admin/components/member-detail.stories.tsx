import type { Meta, StoryObj } from '@storybook/react';
import { MemberDetail } from './member-detail.tsx';
import type { AdminMemberDetailContainerMemberFieldsFragment } from '../../../../generated.tsx';

const mockMember: AdminMemberDetailContainerMemberFieldsFragment = {
	__typename: 'Member',
	id: 'member-123',
	memberName: 'John Doe',
	isAdmin: false,
	community: {
		__typename: 'Community',
		id: 'community-456',
	},
	createdAt: '2024-01-15T10:30:00.000Z',
	updatedAt: '2024-04-05T14:45:00.000Z',
	profile: {
		__typename: 'MemberProfile',
		name: 'Johnny D',
		email: 'john.doe@example.com',
		bio: 'Community member since 2024. Enjoys participating in community events and helping new members.',
		avatarDocumentId: null,
	},
	accounts: [
		{
			__typename: 'MemberAccount',
			id: 'account-1',
			firstName: 'John',
			lastName: 'Doe',
			statusCode: 'ACCEPTED',
			user: {
				__typename: 'EndUser',
				id: 'user-1',
				externalId: 'external-1',
			},
		},
		{
			__typename: 'MemberAccount',
			id: 'account-2',
			firstName: 'John',
			lastName: 'Doe',
			statusCode: 'CREATED',
			user: {
				__typename: 'EndUser',
				id: 'user-2',
				externalId: 'external-2',
			},
		},
	],
};

const mockActiveMember: AdminMemberDetailContainerMemberFieldsFragment = {
	...mockMember,
	memberName: 'Jane Smith',
	isAdmin: true,
	community: {
		__typename: 'Community',
		id: 'community-456',
	},
	profile: {
		...(mockMember.profile || {}),
		name: 'Jane S',
		email: 'jane.smith@example.com',
		bio: 'Active community moderator passionate about fostering positive discussions.',
	},
	accounts: [
		{
			__typename: 'MemberAccount',
			id: 'account-3',
			firstName: 'Jane',
			lastName: 'Smith',
			statusCode: 'ACCEPTED',
			user: {
				__typename: 'EndUser',
				id: 'user-3',
				externalId: 'external-3',
			},
		},
	],
};

const mockPendingMember: AdminMemberDetailContainerMemberFieldsFragment = {
	...mockMember,
	id: 'member-pending',
	memberName: 'Bob Wilson',
	community: {
		__typename: 'Community',
		id: 'community-456',
	},
	profile: {
		...(mockMember.profile || {}),
		name: 'Bob W',
		email: 'bob.wilson@example.com',
		bio: null,
	},
	accounts: [
		{
			__typename: 'MemberAccount',
			id: 'account-pending',
			firstName: 'Bob',
			lastName: 'Wilson',
			statusCode: 'CREATED',
			user: {
				__typename: 'EndUser',
				id: 'user-4',
				externalId: 'external-4',
			},
		},
	],
};

const mockInactiveMember: AdminMemberDetailContainerMemberFieldsFragment = {
	...mockMember,
	id: 'member-inactive',
	memberName: 'Alice Johnson',
	community: {
		__typename: 'Community',
		id: 'community-456',
	},
	profile: {
		...(mockMember.profile || {}),
		name: 'Alice J',
		email: 'alice.johnson@example.com',
		bio: 'Former community member.',
	},
	accounts: [
		{
			__typename: 'MemberAccount',
			id: 'account-inactive',
			firstName: 'Alice',
			lastName: 'Johnson',
			statusCode: 'REJECTED',
			user: {
				__typename: 'EndUser',
				id: 'user-5',
				externalId: 'external-5',
			},
		},
	],
};

const meta = {
	title: 'Admin/Components/MemberDetail',
	component: MemberDetail,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: 'Detailed view of a community member with edit capabilities and role management.',
			},
		},
	},
	argTypes: {
		member: {
			description: 'Member data to display',
		},
		loading: {
			description: 'Loading state for update operations',
			control: 'boolean',
		},
		isEditing: {
			description: 'Whether the component is in edit mode',
			control: 'boolean',
		},
		onEdit: {
			description: 'Callback when edit button is clicked',
		},
		onCancelEdit: {
			description: 'Callback when edit is cancelled',
		},
		onUpdateRole: {
			description: 'Callback when member role is updated',
		},
		onClose: {
			description: 'Callback when detail view is closed',
		},
		onRefresh: {
			description: 'Callback when refresh is requested',
		},
	},
	args: {
		onEdit: () => undefined,
		onCancelEdit: () => undefined,
		onUpdateRole: async () => undefined,
		onClose: () => undefined,
		onRefresh: () => undefined,
	},
} satisfies Meta<typeof MemberDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveMember: Story = {
	args: {
		member: mockActiveMember,
		loading: false,
		isEditing: false,
	},
};

export const EditingMode: Story = {
	args: {
		member: mockActiveMember,
		loading: false,
		isEditing: true,
	},
};

export const PendingMember: Story = {
	args: {
		member: mockPendingMember,
		loading: false,
		isEditing: false,
	},
};

export const InactiveMember: Story = {
	args: {
		member: mockInactiveMember,
		loading: false,
		isEditing: false,
	},
};

export const MultipleAccounts: Story = {
	args: {
		member: mockMember,
		loading: false,
		isEditing: false,
	},
};

export const Loading: Story = {
	args: {
		member: mockActiveMember,
		loading: true,
		isEditing: false,
	},
};

export const MemberNotFound: Story = {
	args: {
		member: null,
		loading: false,
		isEditing: false,
	},
};

export const MinimalProfile: Story = {
	args: {
		member: {
			...mockMember,
			profile: {
				...(mockMember.profile || {}),
				name: null,
				email: null,
				bio: null,
			},
		},
		loading: false,
		isEditing: false,
	},
};
