import type { BlobUploadAuthorizationHeader, BlobUploadCommonResponse, CreateBlobAuthorizationHeaderRequest } from '@cellix/service-blob-storage';
import { type ApplicationServicesFactory, buildApplicationServicesFactory } from '@ocom/application-services';
import type { ApiContextSpec } from '@ocom/context-spec';
import { Persistence } from '@ocom/persistence';
import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { BlobAddress, BlobStorageOperations, ClientUploadOperations, ListBlobsRequest, UploadTextBlobRequest } from '@ocom/service-blob-storage';
import type { EndUserUpdatePayload, QueueStorageOperations } from '@ocom/service-queue-storage';
import type { ServiceMongoose } from '@ocom/service-mongoose';
import type { TokenValidation, TokenValidationResult } from '@ocom/service-token-validation';
import { actors } from '@ocom-verification/verification-shared/test-data';

interface RecordedCommunityCreationMessage {
	communityId: string;
	name: string;
	createdBy: string;
}

type EndUserUpdateQueueTriggerMetadata = Parameters<QueueStorageOperations['receiveFromEndUserUpdateQueue']>[1];
type EndUserUpdateQueueMessage = Awaited<ReturnType<QueueStorageOperations['receiveFromEndUserUpdateQueue']>>;

const communityCreationMessages: RecordedCommunityCreationMessage[] = [];

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

export function resetRecordedQueueMessages(): void {
	communityCreationMessages.length = 0;
}

export function getRecordedCommunityCreationMessages(): RecordedCommunityCreationMessage[] {
	return [...communityCreationMessages];
}

function createRecordingQueueStorageService(): QueueStorageOperations {
	return {
		sendMessageToCommunityCreationQueue(payload) {
			communityCreationMessages.push(payload);
			return Promise.resolve();
		},
		peekAtCommunityCreationQueue() {
			return Promise.resolve(
				communityCreationMessages.map((payload, index) => ({
					id: `recorded-${index}`,
					payload,
					dequeueCount: 0,
				})),
			);
		},
		receiveFromEndUserUpdateQueue(payload: unknown, metadata?: EndUserUpdateQueueTriggerMetadata) {
			return Promise.resolve({
				id: metadata?.id ?? '',
				...(metadata?.popReceipt !== undefined ? { popReceipt: metadata.popReceipt } : {}),
				payload: payload as EndUserUpdatePayload,
				...(metadata?.dequeueCount !== undefined ? { dequeueCount: metadata.dequeueCount } : {}),
			} satisfies EndUserUpdateQueueMessage);
		},
		peekAtEndUserUpdateQueue() {
			return Promise.resolve([]);
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
