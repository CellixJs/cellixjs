import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { Root } from '../index.tsx';

const meta = {
	title: 'Pages/Root/Cms Page',
	component: Root,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof Root>;

export default meta;
type Story = StoryObj<typeof Root>;

export const Default: Story = {
	args: {},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify the CMS page text is present
		const cmsText = await canvas.findByText('Pretend this is a CMS page');
		expect(cmsText).toBeInTheDocument();
	},
};
