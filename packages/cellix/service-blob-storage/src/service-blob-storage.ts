import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { BlobServiceClient, type BlobUploadCommonResponse } from '@azure/storage-blob';
import type { ServiceBase } from '@cellix/api-services-spec';
import { type FeatureFlagsPayload, readFeatureFlags } from './feature-flags.ts';
import type { BlobAddress, BlobListItem, BlobStorage, ListBlobsRequest, ServiceBlobStorageOptions, UploadTextBlobRequest } from './interfaces.ts';

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

	public async downloadText(address: BlobAddress): Promise<string | undefined> {
		try {
			const blobClient = this.getContainerClient(address.containerName).getBlockBlobClient(address.blobName);
			return (await blobClient.downloadToBuffer()).toString('utf-8');
		} catch (error) {
			if (isBlobNotFoundError(error)) {
				return undefined;
			}
			throw error;
		}
	}

	/**
	 * Reads the configured feature-flag document from Blob Storage.
	 *
	 * The document is schema-validated before it is returned. If the Blob does
	 * not exist, this method returns the fallback configured in
	 * `featureFlagOptions`. The service must be started before calling it.
	 *
	 * @returns The validated feature-flag document or its configured fallback.
	 * @throws Error when feature-flag options are absent or the Blob payload is invalid.
	 */
	public async getFeatureFlags(): Promise<FeatureFlagsPayload> {
		const options = this.options.featureFlagOptions;
		if (!options) {
			throw new Error('Feature flag options are required for ServiceBlobStorage');
		}

		return await readFeatureFlags(this, options);
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

function isBlobNotFoundError(error: unknown): boolean {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 'BlobNotFound';
}
