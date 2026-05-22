import './service-config/otel-starter.ts';

import type { ApplicationServices } from '@ocom/application-services';
import { buildApplicationServicesFactory } from '@ocom/application-services';
import type { ApiContextSpec } from '@ocom/context-spec';
import { RegisterEventHandlers } from '@ocom/event-handler';
import type { GraphContext } from '@ocom/graphql-handler';
import { graphHandlerCreator } from '@ocom/graphql-handler';
import { restHandlerCreator } from '@ocom/rest';
import { ServiceApolloServer } from '@ocom/service-apollo-server';
import { ServiceBlobStorage } from '@ocom/service-blob-storage';
import { ServiceMongoose } from '@ocom/service-mongoose';
// queue service imports — framework types only imported here
import { queueRegistry } from '@ocom/service-queue-storage';
import { ServiceTokenValidation } from '@ocom/service-token-validation';
import { Cellix } from './cellix.ts';
import * as ApolloServerConfig from './service-config/apollo-server/index.ts';
import * as BlobStorageConfig from './service-config/blob-storage/index.ts';
import * as MongooseConfig from './service-config/mongoose/index.ts';
import * as QueueConfig from './service-config/queue/index.ts';
import * as TokenValidationConfig from './service-config/token-validation/index.ts';

Cellix.initializeInfrastructureServices<ApiContextSpec, ApplicationServices>((serviceRegistry) => {
	const { NODE_ENV } = process.env;
	const isProd = NODE_ENV === 'production';

	const mongooseService = new ServiceMongoose(MongooseConfig.mongooseConnectionString, MongooseConfig.mongooseConnectOptions);
	const blobStorageService = isProd ? new ServiceBlobStorage({ accountName: BlobStorageConfig.accountName }) : new ServiceBlobStorage({ connectionString: BlobStorageConfig.connectionString });
	const clientOperationsService = new ServiceBlobStorage({ connectionString: BlobStorageConfig.connectionString });
	const tokenValidationService = new ServiceTokenValidation(TokenValidationConfig.portalTokens);
	const apolloService = new ServiceApolloServer<GraphContext>(ApolloServerConfig.apolloServerOptions);

	const { queueService } = QueueConfig.createQueueServices(clientOperationsService, isProd);

	serviceRegistry
		.registerInfrastructureService(mongooseService)
		.registerInfrastructureService(blobStorageService, 'BlobStorageService')
		.registerInfrastructureService(clientOperationsService, 'ClientOperationsService')
		.registerInfrastructureService(queueService, 'QueueStorageService')
		.registerInfrastructureService(tokenValidationService)
		.registerInfrastructureService(apolloService);
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
			clientOperationsService: serviceRegistry.getInfrastructureService<ServiceBlobStorage>('ClientOperationsService'),
			// create typed producer/consumer context for queues (OCOM adapter provides registry)
			...(() => {
				const bound = queueRegistry._bind(serviceRegistry.getInfrastructureService('QueueStorageService'));
				return { queueProducer: bound.producer, queueConsumer: bound.consumer };
			})(),
		};
	})
	.initializeApplicationServices((context) => buildApplicationServicesFactory(context))
	.registerAzureFunctionHttpHandler('graphql', { route: 'graphql/{*segments}', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'] }, (appServicesFactory, infrastructureRegistry) =>
		graphHandlerCreator(infrastructureRegistry.getInfrastructureService<ServiceApolloServer<GraphContext>>(ServiceApolloServer), appServicesFactory),
	)
	.registerAzureFunctionHttpHandler('rest', { route: '{communityId}/{role}/{memberId}/{*rest}' }, restHandlerCreator)
	.startUp();
