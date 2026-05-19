import type { ClientUploadService } from '@cellix/service-blob-storage';
import type { DataSourcesFactory } from '@ocom/persistence';
import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { ServiceBlobStorage } from '@ocom/service-blob-storage';
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
	 * Part of the dual blob storage architecture: manages SDK operations via managed identity.
	 *
	 * Configured by: accountName only (no connection string)
	 * Authentication: Azure Managed Identity (DefaultAzureCredential)
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
	blobStorageService: ServiceBlobStorage;

	/**
	 * Client upload service for generating signed SAS URLs.
	 * Part of the dual blob storage architecture: isolates SAS signing via connection string.
	 * Enables secure browser-based uploads with time-limited, write-only permissions.
	 *
	 * Configured by: connection string only (isolated from SDK operations)
	 * Authentication: Shared-key SAS token generation
	 * Use for: Member avatars, community documents, user-generated content uploads
	 *
	 * Example:
	 * ```ts
	 * const uploadUrl = await context.clientOperationsService.createUploadUrl({
	 *   containerName: 'member-assets',
	 *   blobName: `members/${memberId}/avatar.png`,
	 *   expiresOn: new Date(Date.now() + 15 * 60 * 1000),
	 * });
	 * ```
	 *
	 * OCOM Dual Blob Storage Architecture:
	 *
	 * OCOM registers two separate ServiceBlobStorage instances, each optimized for one responsibility:
	 *
	 * 1. **Backend Blob Service** (blobStorageService)
	 *    - Uses managed identity only
	 *    - No credentials in code or environment
	 *    - Handles: list, upload, delete operations
	 *    - Production best practice
	 *
	 * 2. **Client Upload Service** (clientOperationsService)
	 *    - Uses connection string for SAS signing only
	 *    - Connection string scope isolated to signing, not blob operations
	 *    - Handles: createUploadUrl, createReadUrl for client-side browser uploads
	 *    - Enables secure user-generated content uploads
	 *
	 * Benefits of this dual pattern:
	 * - Managed identity GUARANTEED for all SDK operations (can't accidentally bypass)
	 * - Connection string credential scope narrowed (signing only)
	 * - Clear in code which auth method is used where
	 * - Each service independently testable/mockable
	 * - Aligns with principle: minimize credential exposure, maximize security
	 *
	 * See @ocom/service-blob-storage for full architecture rationale and ADR-0032.
	 */
	// Client-facing narrow contract for upload/signing operations. Named to match runtime registration (ClientOperationsService)
	clientOperationsService: ClientUploadService;
}
