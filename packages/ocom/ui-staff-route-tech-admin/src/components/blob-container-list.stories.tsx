import type { Meta, StoryObj } from '@storybook/react';
import { BlobContainerList } from './blob-container-list.tsx';

const meta: Meta<typeof BlobContainerList> = {
	title: 'TechAdmin/Components/BlobContainerList',
	component: BlobContainerList,
	parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof BlobContainerList>;

export const Default: Story = {
	args: {
		containers: [{ name: 'member-assets' }, { name: 'community-assets' }, { name: 'audit-logs' }],
		onSelect: (name) => console.log('Selected container:', name),
		loading: false,
	},
};

export const Loading: Story = {
	args: {
		containers: [],
		onSelect: () => undefined,
		loading: true,
	},
};

export const Empty: Story = {
	args: {
		containers: [],
		onSelect: () => undefined,
		loading: false,
	},
};
