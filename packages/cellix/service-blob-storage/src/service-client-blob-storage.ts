import { BlobSASPermissions, BlobServiceClient, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import { ClientUploadSigner } from './client-upload-signer.js';
import { isLocalBlobConnectionString, validateSigningConnectionString } from './connection-string.ts';
import type { BlobUploadAuthorizationHeader, ClientBlobStorage, CreateBlobAuthorizationHeaderRequest, CreateBlobSasUrlRequest, ServiceClientBlobStorageOptions } from './interfaces.ts';
import { ServiceBlobStorage } from './service-blob-storage.ts';

export class ServiceClientBlobStorage extends ServiceBlobStorage implements ClientBlobStorage {
	private readonly signingConnectionString: string | undefined;
	private sharedKeyCredentialInternal: StorageSharedKeyCredential | undefined;
	private clientUploadSignerInternal: ClientUploadSigner | undefined;

	constructor(options: ServiceClientBlobStorageOptions) {
		super(options);
		this.signingConnectionString = options.signingConnectionString;
		validateSigningConnectionString(this.signingConnectionString);
	}

	public override async startUp(): Promise<ClientBlobStorage> {
		const signingConnectionString = this.requireSigningConnectionString();
		const { accountName, accountKey } = validateSigningConnectionString(signingConnectionString);
		if (isLocalBlobConnectionString(signingConnectionString)) {
			this.setBlobServiceClient(BlobServiceClient.fromConnectionString(signingConnectionString));
		} else {
			await super.startUp();
		}

		this.sharedKeyCredentialInternal = new StorageSharedKeyCredential(accountName, accountKey);
		this.clientUploadSignerInternal = new ClientUploadSigner({
			blobServiceUrl: this.getBlobServiceUrl(),
			accountName,
			accountKey,
		});
		return this;
	}

	public override shutDown(): Promise<void> {
		this.sharedKeyCredentialInternal = undefined;
		this.clientUploadSignerInternal = undefined;
		return super.shutDown();
	}

	public generateReadSasToken(request: CreateBlobSasUrlRequest): Promise<string> {
		const sas = generateBlobSASQueryParameters(
			{
				containerName: request.containerName,
				blobName: request.blobName,
				expiresOn: request.expiresOn,
				permissions: BlobSASPermissions.parse('r'),
			},
			this.sharedKeyCredential,
		).toString();

		return Promise.resolve(sas);
	}

	public createBlobWriteAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		return this.clientUploadSigner.createBlobWriteAuthorizationHeader(request);
	}

	public createBlobReadAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		return this.clientUploadSigner.createBlobReadAuthorizationHeader(request);
	}

	private get sharedKeyCredential(): StorageSharedKeyCredential {
		if (!this.sharedKeyCredentialInternal) {
			throw new Error('ServiceClientBlobStorage is not started - cannot access shared-key signing capability');
		}
		return this.sharedKeyCredentialInternal;
	}

	private get clientUploadSigner(): ClientUploadSigner {
		if (!this.clientUploadSignerInternal) {
			throw new Error('ServiceClientBlobStorage is not started - cannot access shared-key signing capability');
		}
		return this.clientUploadSignerInternal;
	}

	private requireSigningConnectionString(): string {
		if (typeof this.signingConnectionString !== 'string' || !this.signingConnectionString.trim()) {
			throw new Error("'signingConnectionString' must be a non-empty string");
		}
		return this.signingConnectionString;
	}
}
