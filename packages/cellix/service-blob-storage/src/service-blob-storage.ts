import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { BlobServiceClient, type BlobUploadCommonResponse } from '@azure/storage-blob';
import type { ServiceBase } from '@cellix/api-services-spec';
import type {
	BlobAddress,
	BlobExplorerBlobItem,
	BlobExplorerHierarchyPage,
	BlobListItem,
	BlobStorage,
	ListBlobsHierarchyRequest,
	ListBlobsRequest,
	ListContainersResult,
	ServiceBlobStorageOptions,
	UploadTextBlobRequest,
} from './interfaces.ts';

function validateOptions(options: ServiceBlobStorageOptions): void {
	if (!options.accountName?.trim()) {
		throw new Error("Provide an 'accountName' for blob client authentication");
	}
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

	public async listContainers(): Promise<ListContainersResult> {
		const client = this.requireBlobServiceClient();
		const containers: ListContainersResult['containers'] = [];

		for await (const container of client.listContainers()) {
			const containerClient = client.getContainerClient(container.name);
			containers.push({
				name: container.name,
				url: containerClient.url,
			});
		}

		return { containers };
	}

	public async listBlobsHierarchy(request: ListBlobsHierarchyRequest): Promise<BlobExplorerHierarchyPage> {
		const containerClient = this.getContainerClient(request.containerName);
		const items: BlobExplorerBlobItem[] = [];
		const prefixes: string[] = [];
		const { prefix, continuationToken, maxResults, nameFilter, metadataFilter, tagFilter } = request;

		const listOptions = {
			prefix: prefix ?? '',
			includeTags: true,
			includeMetadata: true,
		};

		const pageSettings = {
			...(continuationToken ? { continuationToken } : {}),
			maxPageSize: maxResults ?? 100,
		};

		const pagedIterator = containerClient.listBlobsByHierarchy('/', listOptions).byPage(pageSettings);
		const page = await pagedIterator.next();

		let nextContinuationToken: string | undefined;

		if (!page.done && page.value) {
			const pageValue = page.value;
			nextContinuationToken = pageValue.continuationToken || undefined;

			for (const item of pageValue.segment.blobPrefixes ?? []) {
				prefixes.push(item.name);
			}

			for (const blob of pageValue.segment.blobItems ?? []) {
				const blobItem: BlobExplorerBlobItem = {
					name: blob.name,
					...(blob.properties.contentType !== undefined ? { contentType: blob.properties.contentType } : {}),
					...(blob.properties.contentLength !== undefined ? { contentLength: blob.properties.contentLength } : {}),
					...(blob.properties.lastModified !== undefined ? { lastModified: blob.properties.lastModified } : {}),
					...(blob.metadata ? { metadata: blob.metadata as Record<string, string> } : {}),
					...(blob.tags ? { tags: blob.tags as Record<string, string> } : {}),
				};

				// Apply client-side name filter
				if (nameFilter && !blob.name.includes(nameFilter)) {
					continue;
				}

				// Apply client-side metadata filter
				if (metadataFilter) {
					const meta = blobItem.metadata ?? {};
					if (meta[metadataFilter.key] !== metadataFilter.value) {
						continue;
					}
				}

				// Apply client-side tag filter
				if (tagFilter) {
					const tags = blobItem.tags ?? {};
					if (tags[tagFilter.key] !== tagFilter.value) {
						continue;
					}
				}

				items.push(blobItem);
			}
		}

		const result: BlobExplorerHierarchyPage = {
			items,
			prefixes,
			...(nextContinuationToken ? { continuationToken: nextContinuationToken } : {}),
		};

		return result;
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

	private requireBlobServiceClient(): BlobServiceClient {
		if (!this.blobServiceClientInternal) {
			throw new Error('ServiceBlobStorage is not started - cannot access blob operations');
		}
		return this.blobServiceClientInternal;
	}
}
