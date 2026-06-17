import type { BlobUploadAuthorizationHeader, BlobUploadCommonResponse, CreateBlobAuthorizationHeaderRequest } from '@cellix/service-blob-storage';
import { type ApplicationServicesFactory, buildApplicationServicesFactory } from '@ocom/application-services';
import type { ApiContextSpec } from '@ocom/context-spec';
import { Persistence } from '@ocom/persistence';
import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { BlobAddress, BlobStorageOperations, ClientUploadOperations, ListBlobsRequest, UploadTextBlobRequest } from '@ocom/service-blob-storage';
import type { ServiceMongoose } from '@ocom/service-mongoose';
import type { TokenValidation, TokenValidationResult } from '@ocom/service-token-validation';
import { actors } from '@ocom-verification/verification-shared/test-data';
import { createRecordingQueueStorageService } from './mock-queue-storage.ts';

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
			return notImplemented();
		},
	} as unknown as ServiceApolloServer<Record<string, never>>;
}

const noOpBlobUploadAuthorizationHeader = {
	url: 'https://blob.example.test/no-op',
	authorizationHeader: '',
	headers: {},
} satisfies BlobUploadAuthorizationHeader;

function createNoOpBlobStorageService(): BlobStorageOperations {
	return {
		uploadText(_request: UploadTextBlobRequest) {
			return Promise.resolve({ _response: {} } as BlobUploadCommonResponse);
		},
		deleteBlob(_address: BlobAddress) {
			return Promise.resolve();
		},
		listBlobs(_request: ListBlobsRequest) {
			return Promise.resolve([]);
		},
	};
}

function createNoOpClientOperationsService(): ClientUploadOperations {
	return {
		createBlobWriteAuthorizationHeader(_request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
			return Promise.resolve(noOpBlobUploadAuthorizationHeader);
		},
		createBlobReadAuthorizationHeader(_request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader> {
			return Promise.resolve(noOpBlobUploadAuthorizationHeader);
		},
	};
}

export function createMockApplicationServicesFactory(serviceMongoose: ServiceMongoose): ApplicationServicesFactory {
	const dataSourcesFactory = Persistence(serviceMongoose);
	const blobStorageService = createNoOpBlobStorageService();
	const clientOperationsService = createNoOpClientOperationsService();
	const queueStorageService = createRecordingQueueStorageService();

	const apiContextSpec: ApiContextSpec = {
		dataSourcesFactory,
		tokenValidationService: createMockTokenValidation(),
		apolloServerService: createNoOpApolloServerService(),
		blobStorageService,
		clientOperationsService,
		queueStorageService,
	};

	const mockApplicationServicesFactory = buildApplicationServicesFactory(apiContextSpec);

	return {
		forRequest: (_rawAuthHeader, hints) => {
			return mockApplicationServicesFactory.forRequest('Bearer test-token', hints);
		},
	};
}
