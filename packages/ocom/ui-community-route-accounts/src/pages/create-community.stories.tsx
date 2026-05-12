import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { Accounts } from '../index.tsx';

const meta = {
	title: 'Pages/Accounts/Create Community',
	component: Accounts,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof Accounts>;

export default meta;
type Story = StoryObj<typeof Accounts>;

export const Default: Story = {
	args: {},
	decorators: [
		(Story) => (
			<MemoryRouter initialEntries={['/create-community']}>
				<Story />
			</MemoryRouter>
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify the page header title is present
		const pageTitle = await canvas.findByText('Create a Community');
		expect(pageTitle).toBeInTheDocument();
	},
};
