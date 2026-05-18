import './service-config/otel-starter.ts';

import { ServiceBlobStorage as CellixServiceBlobStorage } from '@cellix/service-blob-storage';
import type { ApplicationServices } from '@ocom/application-services';
import { buildApplicationServicesFactory } from '@ocom/application-services';
import type { ApiContextSpec } from '@ocom/context-spec';
import { RegisterEventHandlers } from '@ocom/event-handler';
import type { GraphContext } from '@ocom/graphql-handler';
import { graphHandlerCreator } from '@ocom/graphql-handler';
import { restHandlerCreator } from '@ocom/rest';
import { ServiceApolloServer } from '@ocom/service-apollo-server';
import { ServiceBlobStorage as OcomServiceBlobStorage } from '@ocom/service-blob-storage';
import { ServiceMongoose } from '@ocom/service-mongoose';
import { ServiceTokenValidation } from '@ocom/service-token-validation';
import { Cellix } from './cellix.ts';
import * as ApolloServerConfig from './service-config/apollo-server/index.ts';
import * as BlobStorageConfig from './service-config/blob-storage/index.ts';
import * as MongooseConfig from './service-config/mongoose/index.ts';
import * as TokenValidationConfig from './service-config/token-validation/index.ts';

Cellix.initializeInfrastructureServices<ApiContextSpec, ApplicationServices>((serviceRegistry) => {
	serviceRegistry
		.registerInfrastructureService(new ServiceMongoose(MongooseConfig.mongooseConnectionString, MongooseConfig.mongooseConnectOptions))
		// Register two blob storage framework services for separation of concerns
		.registerInfrastructureService(
			// blobStorageService: uses managed identity for backend blob operations
			new CellixServiceBlobStorage({
				accountName: BlobStorageConfig.blobStorageConfig.accountName,
			}),
			{ name: 'blobStorageService' },
		)
		.registerInfrastructureService(
			// clientUploadService: uses connection string for client upload URL signing
			new CellixServiceBlobStorage({
				connectionString: BlobStorageConfig.blobStorageConfig.connectionString,
			}),
			{ name: 'clientUploadService' },
		)
		.registerInfrastructureService(new ServiceTokenValidation(TokenValidationConfig.portalTokens))
		.registerInfrastructureService(new ServiceApolloServer<GraphContext>(ApolloServerConfig.apolloServerOptions));
})
	.setContext((serviceRegistry) => {
		const dataSourcesFactory = MongooseConfig.mongooseContextBuilder(serviceRegistry.getInfrastructureService<ServiceMongoose>(ServiceMongoose));

		const { domainDataSource } = dataSourcesFactory.withSystemPassport();
		RegisterEventHandlers(domainDataSource);

		// Create OCOM adapter, passing both framework services
		const blobStorageAdapter = new OcomServiceBlobStorage({
			sdkService: serviceRegistry.getInfrastructureService<CellixServiceBlobStorage>('blobStorageService'),
			sasSigningService: serviceRegistry.getInfrastructureService<CellixServiceBlobStorage>('clientUploadService'),
		});

		return {
			dataSourcesFactory,
			tokenValidationService: serviceRegistry.getInfrastructureService<ServiceTokenValidation>(ServiceTokenValidation),
			apolloServerService: serviceRegistry.getInfrastructureService<ServiceApolloServer>(ServiceApolloServer),
			blobStorageService: blobStorageAdapter,
		};
	})
	.initializeApplicationServices((context) => buildApplicationServicesFactory(context))
	.registerAzureFunctionHttpHandler('graphql', { route: 'graphql/{*segments}', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'] }, (appServicesFactory, infrastructureRegistry) =>
		graphHandlerCreator(infrastructureRegistry.getInfrastructureService<ServiceApolloServer<GraphContext>>(ServiceApolloServer), appServicesFactory),
	)
	.registerAzureFunctionHttpHandler('rest', { route: '{communityId}/{role}/{memberId}/{*rest}' }, restHandlerCreator)
	.startUp();
