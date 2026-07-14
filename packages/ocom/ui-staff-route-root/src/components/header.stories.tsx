import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './header.tsx';

const meta = {
	title: 'Components/Staff/Root/Header',
	component: Header,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {};
