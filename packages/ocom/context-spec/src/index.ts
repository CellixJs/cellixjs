import type { DataSourcesFactory } from '@ocom/persistence';
import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import type { TokenValidation } from '@ocom/service-token-validation';

/**
 * Application context specification for OCOM.
 *
 * Defines the services and data sources available throughout the application.
 * All dependencies are type-safe and narrowly scoped to their intended use.
 */
export interface ApiContextSpec {
	//mongooseService:Exclude<ServiceMongoose, ServiceBase>;
	/** Factory for creating data source instances (Mongoose models). */
	dataSourcesFactory: DataSourcesFactory; // NOT an infrastructure service

	/** Service for validating authentication tokens from requests. */
	tokenValidationService: TokenValidation;

	/** Apollo Server instance for GraphQL API. */
	apolloServerService: ServiceApolloServer<Record<string, never>>;

	/**
	 * Blob storage service registered for backend blob operations.
	 *
	 * This is the framework `ServiceBlobStorage` class, configured for the
	 * server-side registration that lists, uploads, and deletes blobs.
	 */
	blobStorageService: BlobStorageOperations;

	/**
	 * Blob storage service registered for client signing operations.
	 *
	 * This is the framework `ServiceClientBlobStorage` class, configured with
	 * `signingConnectionString` so the application can generate SharedKey
	 * authorization headers for direct browser uploads and downloads.
	 */
	clientOperationsService: ClientUploadOperations;

	/**
	 * Application-specific queue storage service.
	 * Combines all strongly-typed send, receive, and peek operations derived from the
	 * registered queue definitions. Each registered queue gets its own named method:
	 *  - Outbound queues: `sendMessageTo<QueueName>Queue(payload)`
	 *  - Inbound queues: `receiveFrom<QueueName>Queue(payload, metadata?)`, `peekAt<QueueName>Queue()`
	 *
	 * Example:
	 * ```ts
	 * await context.queueStorageService.sendMessageToCommunityCreationQueue({
	 *   communityId: '123',
	 *   name: 'Test Community',
	 *   createdBy: 'user-1',
	 * });
	 * ```
	 */
	queueStorageService: QueueStorageOperations;
}
