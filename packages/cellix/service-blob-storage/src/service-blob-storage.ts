import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { BlobServiceClient, type BlobUploadCommonResponse } from '@azure/storage-blob';
import type { ServiceBase } from '@cellix/api-services-spec';
import {
	BLOB_DOWNLOAD_MAX_BYTES,
	type BlobAddress,
	type BlobContainerItem,
	type BlobDownloadResult,
	type BlobExplorerItem,
	type BlobFolderItem,
	type BlobHierarchyPage,
	type BlobListItem,
	type BlobStorage,
	type ListBlobHierarchyRequest,
	type ListBlobsRequest,
	type ServiceBlobStorageOptions,
	type UploadTextBlobRequest,
} from './interfaces.ts';

function validateOptions(options: ServiceBlobStorageOptions): void {
	if (!options.accountName?.trim()) {
		throw new Error("Provide an 'accountName' for blob client authentication");
	}
}

function normalizePrefix(prefix: string | undefined): string {
	if (!prefix) {
		return '';
	}
	return prefix.endsWith('/') ? prefix : `${prefix}/`;
}

function immediateName(fullPath: string, prefix: string): string {
	const relative = fullPath.startsWith(prefix) ? fullPath.slice(prefix.length) : fullPath;
	const slash = relative.indexOf('/');
	return slash === -1 ? relative : relative.slice(0, slash);
}

function isTextCompatible(contentType: string | undefined): boolean {
	if (!contentType) {
		return false;
	}
	const normalized = contentType.toLowerCase().split(';')[0]?.trim() ?? '';
	return (
		normalized.startsWith('text/') ||
		normalized === 'application/json' ||
		normalized === 'application/xml' ||
		normalized === 'application/javascript' ||
		normalized === 'application/x-javascript' ||
		normalized.endsWith('+json') ||
		normalized.endsWith('+xml')
	);
}

async function streamToUint8Array(stream: NodeJS.ReadableStream | undefined, maxBytes: number): Promise<Uint8Array> {
	if (!stream) {
		return new Uint8Array();
	}
	const chunks: Buffer[] = [];
	let total = 0;
	for await (const chunk of stream) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		total += buffer.length;
		if (total > maxBytes) {
			throw new Error(`Blob exceeds maximum download size of ${maxBytes} bytes`);
		}
		chunks.push(buffer);
	}
	return new Uint8Array(Buffer.concat(chunks));
}

function matchesNameFilter(name: string, nameContains: string | undefined): boolean {
	if (!nameContains?.trim()) {
		return true;
	}
	return name.toLowerCase().includes(nameContains.trim().toLowerCase());
}

function matchesMetadataFilter(metadata: Record<string, string>, metadataKey: string | undefined, metadataValue: string | undefined): boolean {
	if (!metadataKey?.trim()) {
		return true;
	}
	const key = metadataKey.trim();
	const value = metadata[key];
	if (value === undefined) {
		return false;
	}
	if (metadataValue === undefined || metadataValue === '') {
		return true;
	}
	return value === metadataValue;
}

function escapeTagValue(value: string): string {
	return value.replaceAll("'", "''");
}

export class ServiceBlobStorage implements ServiceBase<BlobStorage>, BlobStorage {
	protected readonly options: ServiceBlobStorageOptions;
	private blobServiceClientInternal: BlobServiceClient | undefined;

	constructor(options: ServiceBlobStorageOptions) {
		validateOptions(options);
		this.options = options;
	}

	public async startUp(): Promise<BlobStorage> {
		await Promise.resolve();

		const { accountName, credential } = this.options;
		const credentialToUse: TokenCredential = credential ?? new DefaultAzureCredential();
		const url = `https://${accountName}.blob.core.windows.net`;

		this.blobServiceClientInternal = new BlobServiceClient(url, credentialToUse);
		console.info(`[ServiceBlobStorage] started (managedIdentity). account=${accountName}, endpoint=${url}`);
		return this;
	}

	public shutDown(): Promise<void> {
		if (!this.blobServiceClientInternal) {
			return Promise.resolve();
		}

		this.blobServiceClientInternal = undefined;
		return Promise.resolve();
	}

	public async uploadText(request: UploadTextBlobRequest): Promise<BlobUploadCommonResponse> {
		const blockBlobClient = this.getContainerClient(request.containerName).getBlockBlobClient(request.blobName);
		const uploadOptions = {
			...(request.httpHeaders ? { blobHTTPHeaders: request.httpHeaders } : {}),
			...(request.metadata ? { metadata: request.metadata } : {}),
			...(request.tags ? { tags: request.tags } : {}),
		};
		return await blockBlobClient.upload(request.text, Buffer.byteLength(request.text), {
			...uploadOptions,
		});
	}

	public async deleteBlob(address: BlobAddress): Promise<void> {
		await this.getContainerClient(address.containerName).deleteBlob(address.blobName);
	}

	public async listBlobs(request: ListBlobsRequest): Promise<BlobListItem[]> {
		const containerClient = this.getContainerClient(request.containerName);
		const blobs: BlobListItem[] = [];
		const listOptions = request.prefix ? { prefix: request.prefix } : undefined;

		for await (const blob of containerClient.listBlobsFlat(listOptions)) {
			blobs.push({
				name: blob.name,
				url: containerClient.getBlockBlobClient(blob.name).url,
			});
		}

		return blobs;
	}

	public async listContainers(): Promise<BlobContainerItem[]> {
		const client = this.requireBlobServiceClient();
		const containers: BlobContainerItem[] = [];
		for await (const container of client.listContainers()) {
			containers.push({ name: container.name });
		}
		return containers.toSorted((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
	}

	public async listBlobHierarchy(request: ListBlobHierarchyRequest): Promise<BlobHierarchyPage> {
		const pageSize = Math.min(Math.max(request.pageSize ?? 50, 1), 100);
		const prefix = normalizePrefix(request.prefix);
		const hasTagFilter = Boolean(request.tagKey?.trim() && request.tagValue !== undefined && request.tagValue !== '');

		if (hasTagFilter) {
			return await this.listBlobHierarchyByTags(request, prefix, pageSize);
		}

		return await this.listBlobHierarchyPage(request, prefix, pageSize);
	}

	public async downloadBlob(address: BlobAddress): Promise<BlobDownloadResult> {
		const blobClient = this.getContainerClient(address.containerName).getBlobClient(address.blobName);
		const properties = await blobClient.getProperties();
		const contentLength = properties.contentLength ?? 0;
		if (contentLength > BLOB_DOWNLOAD_MAX_BYTES) {
			throw new Error(`Blob exceeds maximum download size of ${BLOB_DOWNLOAD_MAX_BYTES} bytes`);
		}

		const [download, tagsResponse] = await Promise.all([blobClient.download(0, BLOB_DOWNLOAD_MAX_BYTES + 1), blobClient.getTags()]);
		const content = await streamToUint8Array(download.readableStreamBody, BLOB_DOWNLOAD_MAX_BYTES);
		const contentType = properties.contentType ?? download.contentType;
		const lastModified = properties.lastModified ?? download.lastModified;
		return {
			...(contentType !== undefined ? { contentType } : {}),
			contentLength,
			...(lastModified !== undefined ? { lastModified } : {}),
			metadata: properties.metadata ?? {},
			tags: tagsResponse.tags ?? {},
			content,
			encoding: isTextCompatible(contentType) ? 'utf-8' : 'binary',
			url: blobClient.url,
		};
	}

	protected setBlobServiceClient(client: BlobServiceClient): void {
		this.blobServiceClientInternal = client;
	}

	protected getContainerClient(containerName: string) {
		return this.requireBlobServiceClient().getContainerClient(containerName);
	}

	protected getBlobServiceUrl(): string {
		return this.requireBlobServiceClient().url;
	}

	private async listBlobHierarchyPage(request: ListBlobHierarchyRequest, prefix: string, pageSize: number): Promise<BlobHierarchyPage> {
		const containerClient = this.getContainerClient(request.containerName);
		const listOptions = {
			includeMetadata: true as const,
			includeTags: true as const,
			...(prefix ? { prefix } : {}),
		};
		const pageSettings = {
			maxPageSize: pageSize,
			...(request.continuationToken ? { continuationToken: request.continuationToken } : {}),
		};
		const iterator = containerClient.listBlobsByHierarchy('/', listOptions).byPage(pageSettings);

		const page = await iterator.next();
		if (page.done || !page.value) {
			return { folders: [], blobs: [] };
		}

		const folders: BlobFolderItem[] = [];
		const blobs: BlobExplorerItem[] = [];

		for (const item of page.value.segment.blobItems ?? []) {
			const name = immediateName(item.name, prefix);
			if (!matchesNameFilter(name, request.nameContains)) {
				continue;
			}
			const metadata = item.metadata ?? {};
			if (!matchesMetadataFilter(metadata, request.metadataKey, request.metadataValue)) {
				continue;
			}
			blobs.push({
				name,
				blobName: item.name,
				url: containerClient.getBlockBlobClient(item.name).url,
				...(item.properties.contentType !== undefined ? { contentType: item.properties.contentType } : {}),
				contentLength: item.properties.contentLength ?? 0,
				...(item.properties.lastModified !== undefined ? { lastModified: item.properties.lastModified } : {}),
				metadata,
				tags: item.tags ?? {},
			});
		}

		for (const blobPrefix of page.value.segment.blobPrefixes ?? []) {
			const folderPrefix = blobPrefix.name;
			const name = immediateName(folderPrefix.replace(/\/$/, ''), prefix) || immediateName(folderPrefix, prefix);
			if (!matchesNameFilter(name, request.nameContains)) {
				continue;
			}
			// Metadata/tag filters apply to blobs only; folders still appear so users can navigate.
			if (request.metadataKey?.trim()) {
				continue;
			}
			folders.push({
				name,
				prefix: folderPrefix.endsWith('/') ? folderPrefix : `${folderPrefix}/`,
			});
		}

		const continuationToken = page.value.continuationToken || undefined;
		return {
			folders,
			blobs,
			...(continuationToken !== undefined ? { continuationToken } : {}),
		};
	}

	private async listBlobHierarchyByTags(request: ListBlobHierarchyRequest, prefix: string, pageSize: number): Promise<BlobHierarchyPage> {
		const tagKey = request.tagKey?.trim() ?? '';
		const tagValue = request.tagValue ?? '';
		const query = `@container='${escapeTagValue(request.containerName)}' AND "${escapeTagValue(tagKey)}"='${escapeTagValue(tagValue)}'`;
		const client = this.requireBlobServiceClient();
		const containerClient = this.getContainerClient(request.containerName);

		const matchingBlobNames: string[] = [];
		const folderMap = new Map<string, BlobFolderItem>();

		for await (const item of client.findBlobsByTags(query)) {
			if (!item.name.startsWith(prefix)) {
				continue;
			}
			const remainder = item.name.slice(prefix.length);
			if (!remainder) {
				continue;
			}
			const slash = remainder.indexOf('/');
			if (slash === -1) {
				matchingBlobNames.push(item.name);
				continue;
			}
			const folderName = remainder.slice(0, slash);
			if (!matchesNameFilter(folderName, request.nameContains)) {
				continue;
			}
			if (request.metadataKey?.trim()) {
				continue;
			}
			const folderPrefix = `${prefix}${folderName}/`;
			folderMap.set(folderPrefix, { name: folderName, prefix: folderPrefix });
		}

		const offset = request.continuationToken ? Number.parseInt(request.continuationToken, 10) : 0;
		const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;

		const folderEntries = [...folderMap.values()].toSorted((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
		const blobNames = matchingBlobNames.filter((blobName) => matchesNameFilter(immediateName(blobName, prefix), request.nameContains)).toSorted((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

		const combined: Array<{ kind: 'folder'; folder: BlobFolderItem } | { kind: 'blob'; blobName: string }> = [
			...folderEntries.map((folder) => ({ kind: 'folder' as const, folder })),
			...blobNames.map((blobName) => ({ kind: 'blob' as const, blobName })),
		];

		const pageItems = combined.slice(safeOffset, safeOffset + pageSize);
		const folders: BlobFolderItem[] = [];
		const blobs: BlobExplorerItem[] = [];

		for (const entry of pageItems) {
			if (entry.kind === 'folder') {
				folders.push(entry.folder);
				continue;
			}
			const blobClient = containerClient.getBlobClient(entry.blobName);
			const [properties, tagsResponse] = await Promise.all([blobClient.getProperties(), blobClient.getTags()]);
			const metadata = properties.metadata ?? {};
			if (!matchesMetadataFilter(metadata, request.metadataKey, request.metadataValue)) {
				continue;
			}
			blobs.push({
				name: immediateName(entry.blobName, prefix),
				blobName: entry.blobName,
				url: containerClient.getBlockBlobClient(entry.blobName).url,
				...(properties.contentType !== undefined ? { contentType: properties.contentType } : {}),
				contentLength: properties.contentLength ?? 0,
				...(properties.lastModified !== undefined ? { lastModified: properties.lastModified } : {}),
				metadata,
				tags: tagsResponse.tags ?? {},
			});
		}

		const nextOffset = safeOffset + pageSize;
		const continuationToken = nextOffset < combined.length ? String(nextOffset) : undefined;
		return {
			folders,
			blobs,
			...(continuationToken !== undefined ? { continuationToken } : {}),
		};
	}

	private requireBlobServiceClient(): BlobServiceClient {
		if (!this.blobServiceClientInternal) {
			throw new Error('ServiceBlobStorage is not started - cannot access blob operations');
		}
		return this.blobServiceClientInternal;
	}
}
