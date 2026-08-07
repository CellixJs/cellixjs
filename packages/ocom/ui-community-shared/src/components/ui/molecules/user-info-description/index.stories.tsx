import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserInfoDescription } from './index.tsx';

const meta: Meta<typeof UserInfoDescription> = {
	title: 'OwnerCommunity/Molecules/UserInfoDescription',
	component: UserInfoDescription,
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UserInfoDescription>;

export const Default: Story = {
	args: {
		label: 'User ID',
		value: '6a550504e3e52f09d01384d9',
	},
};
