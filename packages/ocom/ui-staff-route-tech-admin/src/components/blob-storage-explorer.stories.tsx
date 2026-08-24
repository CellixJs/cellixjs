import { BlobStorageExplorer } from './blob-storage-explorer.tsx';

export default { title: 'Tech Admin/Blob Storage Explorer' };

export const Default = () => (
	<BlobStorageExplorer
		containers={['member-assets', 'private']}
		selectedContainer="member-assets"
		onSelectContainer={() => undefined}
		prefix="avatars/"
		onNavigatePrefix={() => undefined}
		folders={[{ name: 'archived', prefix: 'avatars/archived/' }]}
		blobs={[
			{
				name: 'member-1.png',
				blobName: 'avatars/member-1.png',
				contentType: 'image/png',
				contentLength: 2048,
				lastModified: '2026-05-14T12:00:00.000Z',
				metadata: [{ key: 'source', value: 'upload' }],
				tags: [{ key: 'env', value: 'dev' }],
			},
			{
				name: 'notes.json',
				blobName: 'avatars/notes.json',
				contentType: 'application/json',
				contentLength: 42,
				lastModified: '2026-05-14T13:00:00.000Z',
				metadata: [],
				tags: [],
			},
		]}
		continuationToken="next"
		onLoadMore={() => undefined}
		filters={{
			nameContains: '',
			metadataKey: '',
			metadataValue: '',
			tagKey: '',
			tagValue: '',
		}}
		onApplyFilters={() => undefined}
		onRefresh={() => undefined}
		preview={null}
		onViewBlob={() => undefined}
		onClosePreview={() => undefined}
	/>
);

export const WithTextPreview = () => (
	<BlobStorageExplorer
		containers={['member-assets']}
		selectedContainer="member-assets"
		onSelectContainer={() => undefined}
		prefix=""
		onNavigatePrefix={() => undefined}
		folders={[]}
		blobs={[
			{
				name: 'readme.txt',
				blobName: 'readme.txt',
				contentType: 'text/plain',
				contentLength: 11,
				lastModified: '2026-05-14T12:00:00.000Z',
				metadata: [],
				tags: [],
			},
		]}
		onLoadMore={() => undefined}
		filters={{
			nameContains: '',
			metadataKey: '',
			metadataValue: '',
			tagKey: '',
			tagValue: '',
		}}
		onApplyFilters={() => undefined}
		onRefresh={() => undefined}
		preview={{
			blobName: 'readme.txt',
			contentType: 'text/plain',
			contentLength: 11,
			lastModified: '2026-05-14T12:00:00.000Z',
			metadata: [{ key: 'source', value: 'seed' }],
			tags: [{ key: 'env', value: 'dev' }],
			contentBase64: btoa('hello world'),
			encoding: 'utf-8',
			downloadUrl: null,
		}}
		onViewBlob={() => undefined}
		onClosePreview={() => undefined}
	/>
);
