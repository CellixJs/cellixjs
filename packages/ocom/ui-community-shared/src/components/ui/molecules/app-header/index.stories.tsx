import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppHeader } from './index.tsx';

const meta: Meta<typeof AppHeader> = {
	title: 'OwnerCommunity/Molecules/AppHeader',
	component: AppHeader,
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AppHeader>;

export const LoggedOutLight: Story = {
	args: {
		mode: 'light',
		onThemeChange: () => undefined,
	},
};

export const LoggedOutDark: Story = {
	args: {
		mode: 'dark',
		onThemeChange: () => undefined,
	},
	parameters: {
		backgrounds: { default: 'dark' },
	},
};

export const LoggedInLight: Story = {
	args: {
		mode: 'light',
		onThemeChange: () => undefined,
		user: { firstName: 'Olivia', lastName: 'K' },
	},
};

export const LoggedInDark: Story = {
	args: {
		mode: 'dark',
		onThemeChange: () => undefined,
		user: { firstName: 'Olivia', lastName: 'K' },
	},
	parameters: {
		backgrounds: { default: 'dark' },
	},
};
