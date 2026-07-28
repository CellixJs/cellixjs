import type { Meta, StoryObj } from '@storybook/react';
import { BlobPreviewModal } from './blob-preview-modal.tsx';

const meta: Meta<typeof BlobPreviewModal> = {
	title: 'TechAdmin/Components/BlobPreviewModal',
	component: BlobPreviewModal,
	parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof BlobPreviewModal>;

export const ImagePreview: Story = {
	args: {
		open: true,
		blobName: 'images/logo.png',
		contentType: 'image/png',
		downloadUrl: 'https://via.placeholder.com/400',
		authorizationHeader: undefined,
		onClose: () => console.log('Close'),
		loading: false,
	},
};

export const UnsupportedType: Story = {
	args: {
		open: true,
		blobName: 'data/archive.zip',
		contentType: 'application/zip',
		downloadUrl: 'https://example.com/archive.zip',
		onClose: () => console.log('Close'),
		loading: false,
	},
};

export const Loading: Story = {
	args: {
		open: true,
		blobName: 'documents/report.pdf',
		contentType: 'application/pdf',
		onClose: () => console.log('Close'),
		loading: true,
	},
};

export const Closed: Story = {
	args: {
		open: false,
		blobName: 'documents/report.pdf',
		contentType: 'application/pdf',
		onClose: () => console.log('Close'),
	},
};
