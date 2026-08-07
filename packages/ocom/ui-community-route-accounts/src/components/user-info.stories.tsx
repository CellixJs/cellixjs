import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { UserInfo, type UserInfoProps } from './user-info.tsx';

const meta = {
	title: 'Components/Accounts/UserInfo',
	component: UserInfo,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof UserInfo>;

export default meta;
type Story = StoryObj<typeof UserInfo>;

const mockUserData = {
	id: 'user-123',
	__typename: 'EndUser' as const,
};

export const Default: Story = {
	args: {
		userData: mockUserData,
	} satisfies UserInfoProps,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify the user ID label and value are displayed
		await canvas.findByText('User ID');
		const userIdValue = await canvas.findByText('user-123');
		expect(userIdValue).toBeInTheDocument();
	},
};

export const DifferentUser: Story = {
	args: {
		userData: {
			id: 'user-456',
			__typename: 'EndUser' as const,
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify the different user ID value is displayed
		await canvas.findByText('User ID');
		const userIdValue = await canvas.findByText('user-456');
		expect(userIdValue).toBeInTheDocument();
	},
};
