import type { DataSourcesFactory } from '@ocom/persistence';
import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
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
	 * Blob storage service for backend operations (list, upload, delete).
	 * Part of the dual blob storage architecture: one `ServiceBlobStorage` registration
	 * configured for server-side SDK operations.
	 *
	 * Configured by: connection string in local development or accountName in Azure
	 * Authentication: shared-key in local dev, managed identity in Azure
	 * Use for: Server-side blob operations, documents, app-generated assets
	 *
	 * Example:
	 * ```ts
	 * const documents = await context.blobStorageService.listBlobs({
	 *   containerName: 'community-assets'
	 * });
	 * ```
	 *
	 * See dual blob storage architecture explanation below.
	 */
	// Server-side full service type: exposes the complete ServiceBlobStorage API (server-only operations included)
	blobStorageService: BlobStorageOperations;

	/**
	 * Client upload service for generating signed authorization headers.
	 * Part of the dual blob storage architecture: a second `ServiceBlobStorage` registration
	 * with shared-key signing capability enabled via connection string.
	 *
	 * Configured by: accountName plus signingConnectionString
	 * Authentication: managed identity for SDK client construction, shared-key for signing
	 * Use for: Member avatars, community documents, user-generated content uploads
	 *
	 * Example:
	 * ```ts
	 * const uploadUrl = await context.clientOperationsService.createBlobWriteAuthorizationHeader({
	 *   containerName: 'member-assets',
	 *   blobName: `members/${memberId}/avatar.png`,
	 *   expiresOn: new Date(Date.now() + 15 * 60 * 1000),
	 * });
	 * ```
	 *
	 * OCOM Dual Blob Storage Architecture:
	 *
	 * OCOM registers the same framework blob service class twice, each time with a different responsibility:
	 *
	 * 1. **Backend Blob Service** (`blobStorageService`)
	 *    - Uses local shared-key auth in development or managed identity in Azure
	 *    - Handles: list, upload, delete operations
	 *    - Optimized for server-side SDK work
	 *
	 * 2. **Client Upload Service** (`clientOperationsService`)
	 *    - Uses the same `ServiceBlobStorage` class
	 *    - Opts into shared-key signing via `signingConnectionString`
	 *    - Handles: `createBlobWriteAuthorizationHeader`, `createBlobReadAuthorizationHeader` for client-side browser uploads
	 *    - Narrows the connection string dependency to direct-upload signing flows
	 *
	 * Benefits of this dual pattern:
	 * - Application code still sees narrow, intent-focused interfaces
	 * - The framework service remains reusable and consistent across registrations
	 * - Connection string scope stays isolated to the upload-signing role
	 * - Production server-side blob operations do not require a connection string
	 * - Clear in code which registration is intended for which responsibility
	 *
	 * See @ocom/service-blob-storage for full architecture rationale and ADR-0032.
	 */
	// Client-facing narrow contract for upload/signing operations. Named to match runtime registration (ClientOperationsService)
	clientOperationsService: ClientUploadOperations;
}
