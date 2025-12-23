import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { Header } from './header.tsx';

const meta = {
	title: 'Components/Root/Header',
	component: Header,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
	args: {},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify the login button is present
		const loginButton = await canvas.findByRole('button', { name: /log in/i });
		expect(loginButton).toBeInTheDocument();

		// Verify the button text
		expect(loginButton).toHaveTextContent('Log In v6');
	},
};
