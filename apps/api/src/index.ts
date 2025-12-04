import './service-config/otel-starter.ts';

import { Cellix } from './cellix.ts';
import type { ApiContextSpec } from '@ocom/context-spec';
import { type ApplicationServices, buildApplicationServicesFactory } from '@ocom/application-services';
import { RegisterEventHandlers } from '@ocom/event-handler';

import { ServiceMongoose } from '@ocom/service-mongoose';
import * as MongooseConfig from './service-config/mongoose/index.ts';

import { ServiceBlobStorage } from '@ocom/service-blob-storage';

import { ServiceTokenValidation } from '@ocom/service-token-validation';
import * as TokenValidationConfig from './service-config/token-validation/index.ts';

import { ServiceApolloServer } from '@ocom/service-apollo-server';
import * as ApolloServerConfig from './service-config/apollo-server/index.ts';

import { graphHandlerCreator, type GraphContext } from '@ocom/graphql-handler';
import { restHandlerCreator } from '@ocom/rest';

Cellix
    .initializeInfrastructureServices<ApiContextSpec, ApplicationServices>((serviceRegistry) => {
        serviceRegistry
            .registerInfrastructureService(
                new ServiceMongoose(
                    MongooseConfig.mongooseConnectionString,
                    MongooseConfig.mongooseConnectOptions,
                ),
            )
            .registerInfrastructureService(new ServiceBlobStorage())
            .registerInfrastructureService(
                new ServiceTokenValidation(
                    TokenValidationConfig.portalTokens,
                ),
            );
        
        // Register Apollo Server service
        serviceRegistry.registerInfrastructureService(
            new ServiceApolloServer<GraphContext>(ApolloServerConfig.apolloServerOptions)
        );
    })
    .setContext((serviceRegistry) => {
        const dataSourcesFactory = MongooseConfig.mongooseContextBuilder(
            serviceRegistry.getInfrastructureService<ServiceMongoose>(ServiceMongoose),
        );

        const { domainDataSource} = dataSourcesFactory.withSystemPassport();
        RegisterEventHandlers(domainDataSource);

        return {
            dataSourcesFactory,
            tokenValidationService: serviceRegistry.getInfrastructureService<ServiceTokenValidation>(ServiceTokenValidation),
            apolloServerService: serviceRegistry.getInfrastructureService<ServiceApolloServer>(ServiceApolloServer),
        };
    })
    .initializeApplicationServices((context) => buildApplicationServicesFactory(context))
    .registerAzureFunctionHttpHandler(
        'graphql',
        { route: 'graphql/{*segments}', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'] },
        (appServicesFactory, infrastructureRegistry) => graphHandlerCreator(
            infrastructureRegistry.getInfrastructureService<ServiceApolloServer<GraphContext>>(ServiceApolloServer),
            appServicesFactory
        ),
    )
    .registerAzureFunctionHttpHandler(
        'rest',
        { route: '{communityId}/{role}/{memberId}/{*rest}' },
        restHandlerCreator,
    )
    .startUp();
