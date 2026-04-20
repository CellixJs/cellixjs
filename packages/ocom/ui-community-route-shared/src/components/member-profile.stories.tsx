import type { Meta, StoryObj } from '@storybook/react';
import { MemberProfile } from './member-profile';
import type { MemberProfileContainerMemberFieldsFragment } from '../generated.tsx';

const meta: Meta<typeof MemberProfile> = {
	title: 'Shared/Components/MemberProfile',
	component: MemberProfile,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockMemberData: MemberProfileContainerMemberFieldsFragment = {
	id: 'member-123',
	memberName: 'johndoe',
	profile: {
		name: 'John Doe',
		email: 'john.doe@example.com',
		bio: 'Software developer and community member.',
		showInterests: true,
		showEmail: true,
		showProfile: true,
		showLocation: false,
		showProperties: true,
	},
	createdAt: new Date('2023-01-15'),
	updatedAt: new Date('2023-06-15'),
};

export const Default: Story = {
	args: {
		data: mockMemberData,
		isAdmin: false,
		loading: false,
		onSave: async () => true,
	},
};

export const AdminView: Story = {
	args: {
		data: mockMemberData,
		isAdmin: true,
		loading: false,
		onSave: async () => true,
	},
};

export const MinimalProfile: Story = {
	args: {
		data: {
			...mockMemberData,
			profile: {
				name: null,
				email: null,
				bio: null,
				showInterests: false,
				showEmail: false,
				showProfile: false,
				showLocation: false,
				showProperties: false,
			},
		},
		isAdmin: false,
		loading: false,
		onSave: async () => true,
	},
};
