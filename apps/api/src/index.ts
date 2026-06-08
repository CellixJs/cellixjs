import './service-config/otel-starter.ts';

import type { ApplicationServices } from '@ocom/application-services';
import { buildApplicationServicesFactory } from '@ocom/application-services';
import type { ApiContextSpec } from '@ocom/context-spec';
import { RegisterEventHandlers } from '@ocom/event-handler';
import type { GraphContext } from '@ocom/graphql-handler';
import { graphHandlerCreator } from '@ocom/graphql-handler';
import { restHandlerCreator } from '@ocom/rest';
import { ServiceApolloServer } from '@ocom/service-apollo-server';
import { ServiceBlobStorage, ServiceClientBlobStorage } from '@ocom/service-blob-storage';
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
		.registerInfrastructureService(
			process.env.NODE_ENV === 'production'
				? new ServiceBlobStorage({ accountName: BlobStorageConfig.accountName })
				: new ServiceClientBlobStorage({
						accountName: BlobStorageConfig.accountName,
						signingConnectionString: BlobStorageConfig.signingConnectionString,
					}),
			'BlobStorageService',
		)
		.registerInfrastructureService(
			new ServiceClientBlobStorage({
				accountName: BlobStorageConfig.accountName,
				signingConnectionString: BlobStorageConfig.signingConnectionString,
			}),
			'ClientOperationsService',
		)
		.registerInfrastructureService(new ServiceTokenValidation(TokenValidationConfig.portalTokens))
		.registerInfrastructureService(new ServiceApolloServer<GraphContext>(ApolloServerConfig.apolloServerOptions));
})
	.setContext((serviceRegistry) => {
		const dataSourcesFactory = MongooseConfig.mongooseContextBuilder(serviceRegistry.getInfrastructureService<ServiceMongoose>(ServiceMongoose));

		const { domainDataSource } = dataSourcesFactory.withSystemPassport();
		RegisterEventHandlers(domainDataSource);

		return {
			dataSourcesFactory,
			tokenValidationService: serviceRegistry.getInfrastructureService<ServiceTokenValidation>(ServiceTokenValidation),
			apolloServerService: serviceRegistry.getInfrastructureService<ServiceApolloServer>(ServiceApolloServer),
			blobStorageService: serviceRegistry.getInfrastructureService<ServiceBlobStorage>('BlobStorageService'),
			clientOperationsService: serviceRegistry.getInfrastructureService<ServiceClientBlobStorage>('ClientOperationsService'),
		};
	})
	.initializeApplicationServices((context) => buildApplicationServicesFactory(context))
	.registerAzureFunctionHttpHandler('graphql', { route: 'graphql/{*segments}', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'] }, (appServicesFactory, infrastructureRegistry) =>
		graphHandlerCreator(infrastructureRegistry.getInfrastructureService<ServiceApolloServer<GraphContext>>(ServiceApolloServer), appServicesFactory),
	)
	.registerAzureFunctionHttpHandler('rest', { route: '{communityId}/{role}/{memberId}/{*rest}' }, restHandlerCreator)
	.startUp();
