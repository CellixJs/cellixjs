import type { Meta, StoryObj } from '@storybook/react-vite';
import { OwnerCommunityLogo } from './index.tsx';

const meta: Meta<typeof OwnerCommunityLogo> = {
	title: 'OwnerCommunity/Atoms/OwnerCommunityLogo',
	component: OwnerCommunityLogo,
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OwnerCommunityLogo>;

export const Light: Story = {
	args: {
		mode: 'light',
	},
};

export const Dark: Story = {
	args: {
		mode: 'dark',
	},
	parameters: {
		backgrounds: { default: 'dark' },
	},
};
