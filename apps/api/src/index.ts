import './service-config/otel-starter.ts';

import type { ServiceBase } from '@cellix/api-services-spec';
import { type ApplicationServices, buildApplicationServicesFactory } from '@ocom/application-services';
import type { ApiContextSpec } from '@ocom/context-spec';
import { RegisterEventHandlers } from '@ocom/event-handler';
import { type GraphContext, graphHandlerCreator } from '@ocom/graphql-handler';
import { restHandlerCreator } from '@ocom/rest';
import { ServiceApolloServer } from '@ocom/service-apollo-server';
import { ServiceBlobStorage, ServiceClientBlobStorage } from '@ocom/service-blob-storage';
import { ServiceMongoose } from '@ocom/service-mongoose';
import { type PaymentOperations, ServicePayment, ServicePaymentUnavailable } from '@ocom/service-payment';
import { ServiceQueueStorage } from '@ocom/service-queue-storage';
import { ServiceTokenValidation } from '@ocom/service-token-validation';
import { Cellix } from './cellix.ts';
import * as ApolloServerConfig from './service-config/apollo-server/index.ts';
import * as AzureStorageConfig from './service-config/azure-storage/index.ts';
import * as MongooseConfig from './service-config/mongoose/index.ts';
import * as PaymentConfig from './service-config/payment/index.ts';
import * as QueueStorageConfig from './service-config/queue-storage/index.ts';
import * as TokenValidationConfig from './service-config/token-validation/index.ts';

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === 'production';

/**
 * Selects the payment implementation from configuration. An unrecognised provider is
 * a hard failure: quietly registering the mock would report successful charges that
 * never reached a gateway.
 */
const createPaymentService = (): ServiceBase<PaymentOperations> & PaymentOperations => {
	switch (PaymentConfig.provider) {
		case 'mock':
			if (isProd) {
				throw new Error('Refusing to start: PAYMENT_PROVIDER=mock is an in-memory stub and must not process production billing.');
			}
			return new ServicePayment();
		case 'unavailable':
			return new ServicePaymentUnavailable();
		default:
			throw new Error(`Refusing to start: unsupported PAYMENT_PROVIDER "${PaymentConfig.provider}". No payment gateway implementation exists yet; supported values are "mock" (non-production only) and "unavailable".`);
	}
};

Cellix.initializeInfrastructureServices<ApiContextSpec, ApplicationServices>((serviceRegistry) => {
	serviceRegistry
		.registerInfrastructureService(new ServiceMongoose(MongooseConfig.mongooseConnectionString, MongooseConfig.mongooseConnectOptions))
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
		.registerInfrastructureService(createPaymentService(), 'PaymentService')
		.registerInfrastructureService(new ServiceApolloServer<GraphContext>(ApolloServerConfig.apolloServerOptions));
})
	.setContext((serviceRegistry) => {
		const dataSourcesFactory = MongooseConfig.mongooseContextBuilder(serviceRegistry.getInfrastructureService<ServiceMongoose>(ServiceMongoose));
		const blobStorageService = serviceRegistry.getInfrastructureService<ServiceBlobStorage>('BlobStorageService');
		const paymentService = serviceRegistry.getInfrastructureService<ServiceBase<PaymentOperations> & PaymentOperations>('PaymentService');
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
			paymentService,
		};
	})
	.initializeApplicationServices((context) => buildApplicationServicesFactory(context))
	.registerAzureFunctionHttpHandler('graphql', { route: 'graphql/{*segments}', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'] }, (appServicesFactory, infrastructureRegistry) =>
		graphHandlerCreator(infrastructureRegistry.getInfrastructureService<ServiceApolloServer<GraphContext>>(ServiceApolloServer), appServicesFactory),
	)
	.registerAzureFunctionHttpHandler('rest', { route: '{communityId}/{role}/{memberId}/{*rest}' }, restHandlerCreator)
	.startUp();
