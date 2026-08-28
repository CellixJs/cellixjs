import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { BlobStorageExplorer } from './blob-storage-explorer.tsx';

const baseProps = {
	containers: ['member-assets'],
	selectedContainer: 'member-assets',
	onSelectContainer: () => undefined,
	prefix: '',
	onNavigatePrefix: () => undefined,
	folders: [{ name: 'avatars', prefix: 'avatars/' }],
	blobs: [
		{
			name: 'readme.txt',
			blobName: 'readme.txt',
			contentType: 'text/plain',
			contentLength: 11,
			lastModified: '2026-05-14T12:00:00.000Z',
			metadata: [{ key: 'source', value: 'seed' }],
			tags: [{ key: 'env', value: 'dev' }],
		},
	],
	continuationToken: undefined as string | undefined,
	onLoadMore: () => undefined,
	filters: {
		nameContains: '',
		metadataKey: '',
		metadataValue: '',
		tagKey: '',
		tagValue: '',
	},
	onApplyFilters: () => undefined,
	onRefresh: () => undefined,
	preview: null,
	onViewBlob: () => undefined,
	onClosePreview: () => undefined,
};

test('renders blob storage explorer title and listing', () => {
	render(<BlobStorageExplorer {...baseProps} />);

	expect(screen.getByText(/Blob Storage Explorer/i)).toBeTruthy();
	expect(screen.getAllByText('avatars/').length).toBeGreaterThan(0);
	expect(screen.getAllByText('readme.txt').length).toBeGreaterThan(0);
	expect(screen.getAllByText('text/plain').length).toBeGreaterThan(0);
	expect(screen.getAllByText('source=seed').length).toBeGreaterThan(0);
	expect(screen.getAllByText('env=dev').length).toBeGreaterThan(0);
});

test('navigates into a folder when folder name is clicked', () => {
	const onNavigatePrefix = vi.fn();
	render(
		<BlobStorageExplorer
			{...baseProps}
			onNavigatePrefix={onNavigatePrefix}
		/>,
	);

	const folderLinks = screen.getAllByText('avatars/');
	fireEvent.click(folderLinks[folderLinks.length - 1]);
	expect(onNavigatePrefix).toHaveBeenCalledWith('avatars/');
});

test('invokes view action for a blob', () => {
	const onViewBlob = vi.fn();
	render(
		<BlobStorageExplorer
			{...baseProps}
			onViewBlob={onViewBlob}
		/>,
	);

	const viewButtons = screen.getAllByLabelText('View blob readme.txt');
	fireEvent.click(viewButtons[viewButtons.length - 1]);
	expect(onViewBlob).toHaveBeenCalledWith(
		expect.objectContaining({
			blobName: 'readme.txt',
			contentType: 'text/plain',
		}),
	);
});

test('applies filters from the filter inputs', () => {
	const onApplyFilters = vi.fn();
	render(
		<BlobStorageExplorer
			{...baseProps}
			onApplyFilters={onApplyFilters}
		/>,
	);

	const nameInputs = screen.getAllByLabelText('Filter by blob name');
	const metadataKeyInputs = screen.getAllByLabelText('Filter by metadata key');
	const metadataValueInputs = screen.getAllByLabelText('Filter by metadata value');
	const tagKeyInputs = screen.getAllByLabelText('Filter by tag key');
	const tagValueInputs = screen.getAllByLabelText('Filter by tag value');
	const applyButtons = screen.getAllByText('Apply filters');
	fireEvent.change(nameInputs[nameInputs.length - 1], { target: { value: 'readme' } });
	fireEvent.change(metadataKeyInputs[metadataKeyInputs.length - 1], { target: { value: 'source' } });
	fireEvent.change(metadataValueInputs[metadataValueInputs.length - 1], { target: { value: 'seed' } });
	fireEvent.change(tagKeyInputs[tagKeyInputs.length - 1], { target: { value: 'env' } });
	fireEvent.change(tagValueInputs[tagValueInputs.length - 1], { target: { value: 'dev' } });
	fireEvent.click(applyButtons[applyButtons.length - 1]);

	expect(onApplyFilters).toHaveBeenCalledWith(
		expect.objectContaining({
			nameContains: 'readme',
			metadataKey: 'source',
			metadataValue: 'seed',
			tagKey: 'env',
			tagValue: 'dev',
		}),
	);
});

test('shows preview content and download action', () => {
	render(
		<BlobStorageExplorer
			{...baseProps}
			preview={{
				blobName: 'readme.txt',
				contentType: 'text/plain',
				contentLength: 11,
				lastModified: '2026-05-14T12:00:00.000Z',
				metadata: [],
				tags: [],
				contentBase64: btoa('hello world'),
				encoding: 'utf-8',
				downloadUrl: null,
			}}
		/>,
	);

	expect(screen.getAllByText('hello world').length).toBeGreaterThan(0);
	expect(screen.getAllByLabelText('Download blob').length).toBeGreaterThan(0);
});

test('downloads the original blob from preview content', () => {
	const createObjectURL = vi.fn(() => 'blob:download');
	const revokeObjectURL = vi.fn();
	Object.defineProperty(globalThis.URL, 'createObjectURL', { value: createObjectURL, configurable: true });
	Object.defineProperty(globalThis.URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });

	const clickMock = vi.fn();
	const originalCreateElement = document.createElement.bind(document);
	vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
		const element = originalCreateElement(tagName);
		if (tagName === 'a') {
			element.click = clickMock;
		}
		return element;
	});

	render(
		<BlobStorageExplorer
			{...baseProps}
			preview={{
				blobName: 'avatars/member-1.png',
				contentType: 'image/png',
				contentLength: 5,
				lastModified: '2026-05-14T12:00:00.000Z',
				metadata: [],
				tags: [],
				contentBase64: btoa('hello'),
				encoding: 'binary',
				downloadUrl: 'https://blob.example.test/member-assets/avatars/member-1.png?sig=token',
			}}
		/>,
	);

	fireEvent.click(screen.getAllByLabelText('Download blob')[0]);

	expect(createObjectURL).toHaveBeenCalled();
	expect(clickMock).toHaveBeenCalled();
	expect(revokeObjectURL).toHaveBeenCalledWith('blob:download');
});
