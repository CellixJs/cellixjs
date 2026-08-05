import './service-config/otel-starter.ts';

import { createClient } from 'redis';
import { ServiceRateLimiting, type RateLimitingServiceImplementation } from '@cagematch/rate-limiting';
import { ServiceMongoRateLimiting } from '@cagematch/rate-limiting-mongo';
import { ServiceRedisRateLimiting } from '@cagematch/rate-limiting-redis';
import { type ApplicationServices, buildApplicationServicesFactory } from '@ocom/application-services';
import type { ApiContextSpec } from '@ocom/context-spec';
import { RegisterEventHandlers } from '@ocom/event-handler';
import { type GraphContext, graphHandlerCreator } from '@ocom/graphql-handler';
import { restHandlerCreator } from '@ocom/rest';
import { ServiceApolloServer } from '@ocom/service-apollo-server';
import { ServiceBlobStorage, ServiceClientBlobStorage } from '@ocom/service-blob-storage';
import { ServiceMongoose } from '@ocom/service-mongoose';
import { ServiceQueueStorage } from '@ocom/service-queue-storage';
import { ServiceTokenValidation } from '@ocom/service-token-validation';
import { Cellix } from './cellix.ts';
import * as ApolloServerConfig from './service-config/apollo-server/index.ts';
import * as AzureStorageConfig from './service-config/azure-storage/index.ts';
import * as MongooseConfig from './service-config/mongoose/index.ts';
import * as QueueStorageConfig from './service-config/queue-storage/index.ts';
import * as RateLimitingConfig from './service-config/rate-limiting/index.ts';
import * as TokenValidationConfig from './service-config/token-validation/index.ts';

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === 'production';
const mongooseService = new ServiceMongoose(MongooseConfig.mongooseConnectionString, MongooseConfig.mongooseConnectOptions);
const redisClient = RateLimitingConfig.useRedisRateLimiting ? createClient({ url: RateLimitingConfig.redisConnectionString }) : undefined;
const rateLimitingImplementation: RateLimitingServiceImplementation = RateLimitingConfig.useRedisRateLimiting
	? new ServiceRedisRateLimiting(redisClient as NonNullable<typeof redisClient>, RateLimitingConfig.policies)
	: new ServiceMongoRateLimiting(() => {
			const database = mongooseService.service.connection.db;
			if (!database) {
				throw new Error('MongoDB database is not available for rate limiting');
			}
			return database;
		}, RateLimitingConfig.policies);
const rateLimitingFacade = new ServiceRateLimiting(rateLimitingImplementation);

Cellix.initializeInfrastructureServices<ApiContextSpec, ApplicationServices>((serviceRegistry) => {
	serviceRegistry
		.registerInfrastructureService(mongooseService)
		.registerInfrastructureService(
			isProd
				? new ServiceBlobStorage({ accountName: AzureStorageConfig.accountName })
				: new ServiceClientBlobStorage({
						accountName: AzureStorageConfig.accountName,
						signingConnectionString: AzureStorageConfig.connectionString,
					}),
			'BlobStorageService',
		)
		.registerInfrastructureService(
			new ServiceClientBlobStorage({
				accountName: AzureStorageConfig.accountName,
				signingConnectionString: AzureStorageConfig.connectionString,
			}),
			'ClientOperationsService',
		)
		.registerInfrastructureService(isProd ? new ServiceQueueStorage({ accountName: AzureStorageConfig.accountName as string }) : new ServiceQueueStorage({ connectionString: AzureStorageConfig.connectionString }))
		.registerInfrastructureService(new ServiceTokenValidation(TokenValidationConfig.portalTokens))
		.registerInfrastructureService(rateLimitingFacade)
		.registerInfrastructureService(new ServiceApolloServer<GraphContext>(ApolloServerConfig.apolloServerOptions));
})
	.setContext((serviceRegistry) => {
		const dataSourcesFactory = MongooseConfig.mongooseContextBuilder(serviceRegistry.getInfrastructureService<ServiceMongoose>(ServiceMongoose));
		const blobStorageService = serviceRegistry.getInfrastructureService<ServiceBlobStorage>('BlobStorageService');
		const queueStorageService = serviceRegistry.getInfrastructureService<ServiceQueueStorage>(ServiceQueueStorage);
		if (QueueStorageConfig.logging.enabled) {
			queueStorageService.enableLogging(blobStorageService, QueueStorageConfig.logging);
		}

		const { domainDataSource } = dataSourcesFactory.withSystemPassport();
		RegisterEventHandlers(domainDataSource);

		return {
			dataSourcesFactory,
			tokenValidationService: serviceRegistry.getInfrastructureService<ServiceTokenValidation>(ServiceTokenValidation),
			apolloServerService: serviceRegistry.getInfrastructureService<ServiceApolloServer>(ServiceApolloServer),
			blobStorageService,
			clientOperationsService: serviceRegistry.getInfrastructureService<ServiceClientBlobStorage>('ClientOperationsService'),
			queueStorageService,
			rateLimitingService: serviceRegistry.getInfrastructureService<ServiceRateLimiting>(ServiceRateLimiting),
		};
	})
	.initializeApplicationServices((context) => buildApplicationServicesFactory(context))
	.registerAzureFunctionHttpHandler('graphql', { route: 'graphql/{*segments}', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'] }, (appServicesFactory, infrastructureRegistry) =>
		graphHandlerCreator(infrastructureRegistry.getInfrastructureService<ServiceApolloServer<GraphContext>>(ServiceApolloServer), appServicesFactory),
	)
	.registerAzureFunctionHttpHandler('rest', { route: '{communityId}/{role}/{memberId}/{*rest}' }, restHandlerCreator)
	.startUp();
