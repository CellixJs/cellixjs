import type { Meta, StoryObj } from '@storybook/react';
import { LoginPage } from './login-page.tsx';

const meta = {
	title: 'Pages/Staff/Root/Login',
	component: LoginPage,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof LoginPage>;

export default meta;
type Story = StoryObj<typeof LoginPage>;

export const Default: Story = {};
