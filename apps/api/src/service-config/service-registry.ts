import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { ServiceBlobStorage } from '@ocom/service-blob-storage';
import type { ServiceTokenValidation } from '@ocom/service-token-validation';

export interface ServiceRegistrySpec {
	tokenValidationService: ServiceTokenValidation;
	apolloServerService: ServiceApolloServer;
	blobStorageService: ServiceBlobStorage;
	clientOperationsService: ServiceBlobStorage;
}
