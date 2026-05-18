import { BlobSASPermissions, BlobServiceClient, ContainerSASPermissions, generateBlobSASQueryParameters, type StorageSharedKeyCredential } from '@azure/storage-blob';
import { HeaderConstants } from './auth-header-constants.js';
import { AuthHeaderGenerator } from './auth-header-generator.js';
import { createCredentialFromConnectionString, getConnectionStringValue } from './connection-string.js';
import type { BlobUploadAuthorizationHeader, CreateBlobAuthorizationHeaderRequest, CreateBlobSasUrlRequest, CreateContainerSasUrlRequest } from './interfaces.js';

/**
 * ClientUploadSigner handles generation of signed authorization headers for client-side blob uploads.
 * It requires a connection string to be provided at construction time.
 *
 * Supports two signing approaches:
 * - createBlobWriteSasUrl/createBlobReadSasUrl: Legacy SAS token URLs
 * - createBlobWriteAuthorizationHeader/createBlobReadAuthorizationHeader: Canonical SharedKey auth headers
 */
export class ClientUploadSigner {
	private readonly sharedKeyCredential: StorageSharedKeyCredential;
	private readonly blobServiceClient: BlobServiceClient;
	private readonly authHeaderGenerator: AuthHeaderGenerator;
	private readonly accountName: string;
	private readonly accountKey: string;

	constructor(connectionString: string) {
		if (!connectionString?.trim()) {
			throw new Error('connectionString is required to create ClientUploadSigner');
		}
		this.sharedKeyCredential = createCredentialFromConnectionString(connectionString);
		this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
		this.authHeaderGenerator = new AuthHeaderGenerator();

		// Extract account name and key from connection string for auth header generation
		const accountName = getConnectionStringValue(connectionString, 'AccountName');
		const accountKey = getConnectionStringValue(connectionString, 'AccountKey');

		if (!accountName || !accountKey) {
			throw new Error('Connection string must include both AccountName and AccountKey for auth header generation');
		}

		this.accountName = accountName;
		this.accountKey = accountKey;
	}

	/**
	 * Create a signed authorization header for blob write (PUT) requests.
	 * Returns headers and authorization value for client-side uploads with metadata locking.
	 */
	public createBlobWriteAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		return Promise.resolve(this.createAuthorizationHeader(request, 'PUT'));
	}

	/**
	 * Create a signed authorization header for blob read (GET) requests.
	 * Returns headers and authorization value for client-side downloads with metadata locking.
	 */
	public createBlobReadAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		return Promise.resolve(this.createAuthorizationHeader(request, 'GET'));
	}

	/**
	 * Create a blob-scoped read SAS URL (legacy approach).
	 * @deprecated Use createBlobReadAuthorizationHeader for canonical auth headers instead.
	 */
	public createBlobReadSasUrl(request: CreateBlobSasUrlRequest): Promise<string> {
		return Promise.resolve(this.createBlobSasUrl(request, BlobSASPermissions.parse('r')));
	}

	/**
	 * Create a blob-scoped write SAS URL (legacy approach).
	 * @deprecated Use createBlobWriteAuthorizationHeader for canonical auth headers instead.
	 */
	public createBlobWriteSasUrl(request: CreateBlobSasUrlRequest): Promise<string> {
		return Promise.resolve(this.createBlobSasUrl(request, BlobSASPermissions.parse('cw')));
	}

	/**
	 * Create a container-scoped SAS URL for listing blobs (legacy approach).
	 * @deprecated Use canonical auth headers for new implementations.
	 */
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

	private createAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest, method: 'PUT' | 'GET'): BlobUploadAuthorizationHeader {
		const url = this.buildBlobUrl(request.containerName, request.blobName);

		// Build headers dict for signing
		const headers: Record<string, string> = {
			[HeaderConstants.CONTENT_TYPE]: request.contentType,
			[HeaderConstants.CONTENT_LENGTH]: String(request.contentLength),
			[HeaderConstants.X_MS_BLOB_TYPE]: 'BlockBlob',
			[HeaderConstants.X_MS_VERSION]: '2021-04-10',
			[HeaderConstants.X_MS_DATE]: new Date().toUTCString(),
		};

		// Add metadata headers if provided
		if (request.metadata) {
			for (const [key, value] of Object.entries(request.metadata)) {
				headers[`${HeaderConstants.X_MS_META}${key}`] = value;
			}
		}

		// Generate the signed authorization header
		const authorizationHeader = this.authHeaderGenerator.generateAuthorizationHeader(headers, this.accountName, this.accountKey, method, url);

		return {
			url,
			authorizationHeader,
			headers,
		};
	}

	private buildBlobUrl(containerName: string, blobName: string): string {
		const baseUrl = this.blobServiceClient.url;
		// baseUrl might not have trailing slash, e.g., http://127.0.0.1:10000/devstoreaccount1
		// Ensure we add slashes between account, container, and blob
		const trimmedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
		return `${trimmedBase}${containerName}/${blobName}`;
	}
}
