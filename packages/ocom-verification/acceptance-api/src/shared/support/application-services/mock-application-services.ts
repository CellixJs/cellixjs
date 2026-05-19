import type { BaseContext } from '@apollo/server';
import type { BlobAddress, BlobUploadAuthorizationHeader, CreateBlobAuthorizationHeaderRequest, CreateBlobSasUrlRequest, ListBlobsRequest, UploadTextBlobRequest } from '@cellix/service-blob-storage';
import { type ApplicationServicesFactory, buildApplicationServicesFactory } from '@ocom/application-services';
import type { ApiContextSpec } from '@ocom/context-spec';
import { Persistence } from '@ocom/persistence';
import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import { ServiceBlobStorage } from '@ocom/service-blob-storage';
import type { ServiceMongoose } from '@ocom/service-mongoose';
import type { TokenValidation, TokenValidationResult } from '@ocom/service-token-validation';
import { actors } from '@ocom-verification/verification-shared/test-data';

function createMockTokenValidation(): TokenValidation {
	return {
		verifyJwt: <ClaimsType>(_token: string): Promise<TokenValidationResult<ClaimsType> | null> => {
			const actor = actors.CommunityOwner;
			return Promise.resolve({
				verifiedJwt: {
					given_name: actor.givenName,
					family_name: actor.familyName,
					email: actor.email,
					sub: actor.externalId,
				} as unknown as ClaimsType,
				openIdConfigKey: 'AccountPortal',
			});
		},
	};
}

function createNoOpApolloServerService(): ServiceApolloServer<Record<string, never>> {
	const notImplemented = () => {
		throw new Error('ServiceApolloServer not implemented in test session');
	};
	return {
		startUp: () => Promise.resolve({} as unknown as Awaited<ReturnType<ServiceApolloServer<Record<string, never>>['startUp']>>),
		shutDown: () => Promise.resolve(),
		get service(): never {
			return notImplemented() as never;
		},
	} as unknown as ServiceApolloServer<BaseContext>;
}

const noOpBlobUploadAuthorizationHeader = {
	url: 'https://blob.example.test/no-op',
	authorizationHeader: '',
	headers: {},
} satisfies BlobUploadAuthorizationHeader;

class NoOpBlobStorageService extends ServiceBlobStorage {
	public constructor() {
		super({ accountName: 'no-op-account' });
	}

	public override startUp(): Promise<this> {
		return Promise.resolve(this);
	}

	public override shutDown(): Promise<void> {
		return Promise.resolve();
	}

	public override uploadText(_request: UploadTextBlobRequest): ReturnType<ServiceBlobStorage['uploadText']> {
		return Promise.resolve({} as Awaited<ReturnType<ServiceBlobStorage['uploadText']>>);
	}

	public override deleteBlob(_address: BlobAddress): Promise<void> {
		return Promise.resolve();
	}

	public override listBlobs(_request: ListBlobsRequest): Promise<[]> {
		return Promise.resolve([]);
	}

	public override generateReadSasToken(_request: CreateBlobSasUrlRequest): Promise<string> {
		return Promise.resolve('');
	}

	public override createBlobWriteAuthorizationHeader(_request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		return Promise.resolve(noOpBlobUploadAuthorizationHeader);
	}

	public override createBlobReadAuthorizationHeader(_request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		return Promise.resolve(noOpBlobUploadAuthorizationHeader);
	}

	public override createUploadUrl(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		return this.createBlobWriteAuthorizationHeader(request);
	}

	public override createReadUrl(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
		return this.createBlobReadAuthorizationHeader(request);
	}
}

function createNoOpBlobStorageService(): ServiceBlobStorage {
	return new NoOpBlobStorageService();
}

export function createMockApplicationServicesFactory(serviceMongoose: ServiceMongoose): ApplicationServicesFactory {
	const dataSourcesFactory = Persistence(serviceMongoose);
	const blobStorageService = createNoOpBlobStorageService();

	const apiContextSpec: ApiContextSpec = {
		dataSourcesFactory,
		tokenValidationService: createMockTokenValidation(),
		apolloServerService: createNoOpApolloServerService(),
		blobStorageService,
		clientOperationsService: blobStorageService,
	};

	const mockApplicationServicesFactory = buildApplicationServicesFactory(apiContextSpec);

	return {
		forRequest: (_rawAuthHeader, hints) => {
			return mockApplicationServicesFactory.forRequest('Bearer test-token', hints);
		},
	};
}
