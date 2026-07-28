import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { BlobExplorerPage } from './blob-explorer.tsx';

const meta: Meta<typeof BlobExplorerPage> = {
	title: 'TechAdmin/Pages/BlobExplorerPage',
	component: BlobExplorerPage,
	parameters: { layout: 'fullscreen' },
	decorators: [
		(Story) => (
			<MemoryRouter>
				<Story />
			</MemoryRouter>
		),
	],
};

export default meta;
type Story = StoryObj<typeof BlobExplorerPage>;

export const Default: Story = {};
