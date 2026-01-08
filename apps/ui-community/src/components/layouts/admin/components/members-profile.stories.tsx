import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import type { AdminMembersProfileContainerMemberFieldsFragment } from '../../../../generated.tsx';
import { MembersProfile } from './members-profile.tsx';

const mockMemberWithProfile: AdminMembersProfileContainerMemberFieldsFragment =
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439011',
		profile: {
			__typename: 'MemberProfile',
			name: 'John Doe',
			email: 'john.doe@example.com',
			bio: 'Software developer with 10 years of experience',
			showEmail: true,
			showProfile: true,
		},
	};

const mockMemberWithoutProfile: AdminMembersProfileContainerMemberFieldsFragment =
	{
		__typename: 'Member',
		id: '507f1f77bcf86cd799439012',
		profile: null,
	};

const meta: Meta<typeof MembersProfile> = {
	title: 'Components/Layouts/Admin/MembersProfile',
	component: MembersProfile,
	parameters: {
		layout: 'padded',
	},
};

export default meta;
type Story = StoryObj<typeof MembersProfile>;

export const WithProfile: Story = {
	args: {
		data: {
			member: mockMemberWithProfile,
		},
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify profile data is displayed
		expect(canvas.getByText('John Doe')).toBeInTheDocument();
		expect(canvas.getByText('john.doe@example.com')).toBeInTheDocument();
		expect(
			canvas.getByText('Software developer with 10 years of experience'),
		).toBeInTheDocument();
		expect(canvas.getAllByText('Yes')).toHaveLength(2); // showEmail and showProfile
	},
};

export const WithoutProfile: Story = {
	args: {
		data: {
			member: mockMemberWithoutProfile,
		},
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify N/A is displayed for missing data
		expect(canvas.getAllByText('N/A')).toHaveLength(3); // name, email, bio
		expect(canvas.getAllByText('No')).toHaveLength(2); // showEmail, showProfile
	},
};

export const PartialProfile: Story = {
	args: {
		data: {
			member: {
				id: '507f1f77bcf86cd799439013',
				profile: {
					name: 'Jane Smith',
					email: null,
					bio: null,
					showEmail: false,
					showProfile: true,
				},
			},
		},
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify partial data is displayed correctly
		expect(canvas.getByText('Jane Smith')).toBeInTheDocument();
		expect(canvas.getAllByText('N/A')).toHaveLength(2); // email, bio
		expect(canvas.getByText('Yes')).toBeInTheDocument(); // showProfile
		expect(canvas.getByText('No')).toBeInTheDocument(); // showEmail
	},
};
