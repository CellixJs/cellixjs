import type { Meta, StoryObj } from '@storybook/react-vite';
import { PublicShell } from './index.tsx';

const meta: Meta<typeof PublicShell> = {
	title: 'OwnerCommunity/Organisms/PublicShell',
	component: PublicShell,
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PublicShell>;

export const LoggedOutLight: Story = {
	args: {
		mode: 'light',
		onThemeChange: () => undefined,
		children: <div>Page content goes here</div>,
	},
};

export const LoggedInDark: Story = {
	args: {
		mode: 'dark',
		onThemeChange: () => undefined,
		user: { firstName: 'Olivia', lastName: 'K' },
		children: <div>Page content goes here</div>,
	},
	parameters: {
		backgrounds: { default: 'dark' },
	},
};
