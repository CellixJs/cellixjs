import { BlobSASPermissions, BlobServiceClient, ContainerSASPermissions, generateBlobSASQueryParameters, type StorageSharedKeyCredential } from '@azure/storage-blob';
import { createCredentialFromConnectionString } from './connection-string.ts';
import type { CreateBlobSasUrlRequest, CreateContainerSasUrlRequest } from './interfaces.ts';

/**
 * ClientUploadSigner handles generation of SAS URLs using StorageSharedKeyCredential.
 * It requires a connection string to be provided at construction time.
 */
export class ClientUploadSigner {
	private readonly sharedKeyCredential: StorageSharedKeyCredential;
	private readonly blobServiceClient: BlobServiceClient;

	constructor(connectionString: string) {
		if (!connectionString?.trim()) {
			throw new Error('connectionString is required to create ClientUploadSigner');
		}
		this.sharedKeyCredential = createCredentialFromConnectionString(connectionString);
		this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
	}

	public createBlobReadSasUrl(request: CreateBlobSasUrlRequest): Promise<string> {
		return Promise.resolve(this.createBlobSasUrl(request, BlobSASPermissions.parse('r')));
	}

	public createBlobWriteSasUrl(request: CreateBlobSasUrlRequest): Promise<string> {
		return Promise.resolve(this.createBlobSasUrl(request, BlobSASPermissions.parse('cw')));
	}

	public createContainerListSasUrl(request: CreateContainerSasUrlRequest): Promise<string> {
		const containerClient = this.blobServiceClient.getContainerClient(request.containerName);
		const containerUrl = containerClient.url;
		const sas = generateBlobSASQueryParameters(
			{
				containerName: request.containerName,
				expiresOn: request.expiresOn,
				permissions: ContainerSASPermissions.parse('rl'),
			},
			this.sharedKeyCredential,
		).toString();
		return Promise.resolve(`${containerUrl}?${sas}`);
	}

	private createBlobSasUrl(request: CreateBlobSasUrlRequest, permissions: BlobSASPermissions): string {
		const blobClient = this.blobServiceClient.getContainerClient(request.containerName).getBlockBlobClient(request.blobName);
		const sas = generateBlobSASQueryParameters(
			{
				containerName: request.containerName,
				blobName: request.blobName,
				expiresOn: request.expiresOn,
				permissions,
			},
			this.sharedKeyCredential,
		).toString();
		return `${blobClient.url}?${sas}`;
	}
}
