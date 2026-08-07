import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeToggle } from './index.tsx';

const meta: Meta<typeof ThemeToggle> = {
	title: 'OwnerCommunity/Atoms/ThemeToggle',
	component: ThemeToggle,
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Light: Story = {
	args: {
		checked: false,
	},
};

export const Dark: Story = {
	args: {
		checked: true,
	},
};
