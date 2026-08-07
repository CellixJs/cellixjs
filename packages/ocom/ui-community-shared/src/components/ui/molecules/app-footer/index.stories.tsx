import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppFooter } from './index.tsx';

const meta: Meta<typeof AppFooter> = {
	title: 'OwnerCommunity/Molecules/AppFooter',
	component: AppFooter,
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AppFooter>;

export const Default: Story = {};

export const CustomText: Story = {
	args: {
		copyrightText: '©2024 Owner Community',
	},
};
