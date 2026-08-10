import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node';
import type { BlobUploadAuthorizationHeader, BlobUploadCommonResponse, CreateBlobAuthorizationHeaderRequest } from '@cellix/service-blob-storage';
import { type ApplicationServicesFactory, buildApplicationServicesFactory } from '@ocom/application-services';
import type { ApiContextSpec } from '@ocom/context-spec';
import { RegisterEventHandlers } from '@ocom/event-handler';
import { Persistence } from '@ocom/persistence';
import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { BlobAddress, BlobStorageOperations, ClientUploadOperations, ListBlobsRequest, UploadTextBlobRequest } from '@ocom/service-blob-storage';
import type { ServiceMongoose } from '@ocom/service-mongoose';
import type { EndUserUpdatePayload, QueueStorageOperations } from '@ocom/service-queue-storage';
import type { TokenValidation, TokenValidationResult } from '@ocom/service-token-validation';
import { actors, getActor } from '@ocom-verification/verification-shared/test-data';
import { STAFF_TOKEN_PREFIX, USER_TOKEN_PREFIX } from './shared/abilities/actor-auth.ts';

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
		verifyJwt: <ClaimsType>(token: string): Promise<TokenValidationResult<ClaimsType> | null> => {
			// Staff tokens (e.g. "staff:TechAdminStaff") resolve to a StaffPortal principal
			// whose enterprise app roles come from the shared test actor definition.
			if (token.startsWith(STAFF_TOKEN_PREFIX)) {
				const staffActor = getActor(token.slice(STAFF_TOKEN_PREFIX.length));
				return Promise.resolve({
					verifiedJwt: {
						given_name: staffActor.givenName,
						family_name: staffActor.familyName,
						email: staffActor.email,
						sub: staffActor.externalId,
						roles: staffActor.roles ?? [],
					} as unknown as ClaimsType,
					openIdConfigKey: 'StaffPortal',
				});
			}
			// End-user tokens (e.g. "user:CommunityMember") resolve to the named test
			// actor's AccountPortal principal, so scenarios can act as different members.
			if (token.startsWith(USER_TOKEN_PREFIX)) {
				const endUserActor = getActor(token.slice(USER_TOKEN_PREFIX.length));
				return Promise.resolve({
					verifiedJwt: {
						given_name: endUserActor.givenName,
						family_name: endUserActor.familyName,
						email: endUserActor.email,
						sub: endUserActor.externalId,
					} as unknown as ClaimsType,
					openIdConfigKey: 'AccountPortal',
				});
			}
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

/**
 * Register the production `@ocom/event-handler` handlers exactly once per test
 * process, so integration events (e.g. CommunityCreated → provision the admin
 * member and default role) run in acceptance scenarios the way they do in
 * `apps/api`. The underlying NodeEventBus is a process-wide singleton, so a
 * second registration would duplicate handler side effects.
 */
let integrationEventHandlersRegistered = false;

const inFlightIntegrationEventHandlers = new Set<Promise<void>>();

function trackHandlerInvocation(invocation: Promise<void>): void {
	inFlightIntegrationEventHandlers.add(invocation);
	invocation
		.catch(() => {
			// Handler failures are already logged by the event bus; tracking only
			// cares that the invocation has settled.
		})
		.finally(() => {
			inFlightIntegrationEventHandlers.delete(invocation);
		});
}

/**
 * Wait until all in-flight integration event handler invocations have settled.
 *
 * NodeEventBus dispatch is fire-and-forget by design (pinned by
 * `node-event-bus.feature`), so scenario cleanup must drain in-flight handlers
 * before the database is reset; otherwise background provisioning writes (e.g.
 * CommunityCreated → member/role provisioning) can land in the next scenario's
 * freshly seeded database.
 */
export async function drainIntegrationEventHandlers(): Promise<void> {
	while (inFlightIntegrationEventHandlers.size > 0) {
		await Promise.allSettled([...inFlightIntegrationEventHandlers]);
	}
}

function registerIntegrationEventHandlersOnce(dataSourcesFactory: ReturnType<typeof Persistence>): void {
	if (integrationEventHandlersRegistered) {
		return;
	}
	const { domainDataSource } = dataSourcesFactory.withSystemPassport();
	// Wrap handler registration so every handler invocation is tracked and can
	// be drained during scenario cleanup, without changing the production
	// bus's fire-and-forget dispatch semantics.
	const originalRegister = NodeEventBusInstance.register.bind(NodeEventBusInstance);
	const trackingRegister: typeof originalRegister = (event, func) => {
		originalRegister(event, (payload) => {
			const invocation = Promise.resolve(func(payload));
			trackHandlerInvocation(invocation);
			return invocation;
		});
	};
	NodeEventBusInstance.register = trackingRegister;
	try {
		RegisterEventHandlers(domainDataSource);
	} finally {
		NodeEventBusInstance.register = originalRegister;
	}
	integrationEventHandlersRegistered = true;
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
	registerIntegrationEventHandlersOnce(dataSourcesFactory);
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

	// Pass the raw auth header through so scenarios can act as differently
	// privileged (or unauthenticated) principals via per-actor test tokens.
	return buildApplicationServicesFactory(apiContextSpec);
}
