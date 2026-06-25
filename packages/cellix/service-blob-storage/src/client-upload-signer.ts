import { HeaderConstants } from './auth-header-constants.js';
import { AuthHeaderGenerator } from './auth-header-generator.js';
import type { BlobUploadAuthorizationHeader, CreateBlobAuthorizationHeaderRequest } from './interfaces.js';

/**
 * Internal helper for generating signed authorization headers for client-side blob requests.
 *
 * The signer is intentionally decoupled from Azure SDK client creation. The framework
 * service provides the blob endpoint URL and the shared-key material to sign with.
 */
export class ClientUploadSigner {
	private readonly authHeaderGenerator: AuthHeaderGenerator;
	private readonly accountName: string;
	private readonly accountKey: string;
	private readonly blobServiceUrl: string;

	constructor(options: { blobServiceUrl: string; accountName: string; accountKey: string }) {
		if (!options.blobServiceUrl?.trim()) {
			throw new Error('blobServiceUrl is required to create ClientUploadSigner');
		}
		if (!options.accountName?.trim()) {
			throw new Error('accountName is required to create ClientUploadSigner');
		}
		if (!options.accountKey?.trim()) {
			throw new Error('accountKey is required to create ClientUploadSigner');
		}

		this.authHeaderGenerator = new AuthHeaderGenerator();
		this.accountName = options.accountName;
		this.accountKey = options.accountKey;
		this.blobServiceUrl = options.blobServiceUrl;
	}

	/**
	 * Create a signed authorization header for blob write (PUT) requests.
	 *
	 * Returns the target URL, the SharedKey authorization header, and the headers
	 * that must be sent with the client request.
	 */
	public createBlobWriteAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		return Promise.resolve(this.createAuthorizationHeader(request, 'PUT'));
	}

	/**
	 * Create a signed authorization header for blob read (GET) requests.
	 *
	 * Returns the target URL, the SharedKey authorization header, and the headers
	 * that must be sent with the client request.
	 */
	public createBlobReadAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		return Promise.resolve(this.createAuthorizationHeader(request, 'GET'));
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
		const baseUrl = this.blobServiceUrl;
		// baseUrl might not have trailing slash, e.g., http://127.0.0.1:10000/devstoreaccount1
		// Ensure we add slashes between account, container, and blob
		const trimmedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
		return `${trimmedBase}${containerName}/${blobName}`;
	}
}
