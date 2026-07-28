import type { Meta, StoryObj } from '@storybook/react';
import { BlobList } from './blob-list.tsx';

const meta: Meta<typeof BlobList> = {
	title: 'TechAdmin/Components/BlobList',
	component: BlobList,
	parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof BlobList>;

const mockItems = [
	{ name: 'documents/report.pdf', contentType: 'application/pdf', contentLength: 204800, lastModified: '2024-01-15T10:00:00Z' },
	{ name: 'images/logo.png', contentType: 'image/png', contentLength: 51200, lastModified: '2024-02-01T12:00:00Z' },
	{ name: 'data.json', contentType: 'application/json', contentLength: 1024, lastModified: '2024-03-01T08:00:00Z' },
];

export const Default: Story = {
	args: {
		items: mockItems,
		prefixes: ['documents/', 'images/'],
		onNavigate: (prefix) => console.log('Navigate to:', prefix),
		onView: (item) => console.log('View:', item.name),
		breadcrumbs: [],
		onBreadcrumb: (index) => console.log('Breadcrumb:', index),
		loading: false,
	},
};

export const Loading: Story = {
	args: {
		items: [],
		prefixes: [],
		onNavigate: () => undefined,
		onView: () => undefined,
		breadcrumbs: [],
		onBreadcrumb: () => undefined,
		loading: true,
	},
};

export const WithBreadcrumbs: Story = {
	args: {
		items: mockItems,
		prefixes: [],
		onNavigate: () => undefined,
		onView: () => undefined,
		breadcrumbs: ['documents', 'reports'],
		onBreadcrumb: (index) => console.log('Breadcrumb:', index),
		loading: false,
	},
};

export const WithLoadMore: Story = {
	args: {
		items: mockItems,
		prefixes: [],
		onNavigate: () => undefined,
		onView: () => undefined,
		breadcrumbs: [],
		onBreadcrumb: () => undefined,
		continuationToken: 'next-page-token',
		onLoadMore: () => console.log('Load more'),
		loading: false,
	},
};
