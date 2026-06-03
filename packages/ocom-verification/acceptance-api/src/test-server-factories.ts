import { ApolloGraphQLTestServer } from '@cellix/serenity-framework/servers';
import type { ApplicationServices } from '@ocom/application-services';
import { combinedSchema } from '@ocom/graphql';
import { ServiceMongoose } from '@ocom/service-mongoose';
import depthLimit from 'graphql-depth-limit';
import { applyMiddleware } from 'graphql-middleware';
import { createMockApplicationServicesFactory } from './shared/application-services/index.ts';

let mockApplicationServicesFactory: ReturnType<typeof createMockApplicationServicesFactory> | undefined;

export function createApiMongooseService(connectionString: string, dbName: string): ServiceMongoose {
	return new ServiceMongoose(connectionString, {
		autoCreate: true,
		autoIndex: true,
		dbName,
	});
}

export function createApiGraphQLServer(getMongooseService: () => ServiceMongoose): ApolloGraphQLTestServer<{ applicationServices: ApplicationServices }> {
	return new ApolloGraphQLTestServer<{ applicationServices: ApplicationServices }>({
		schema: applyMiddleware(combinedSchema),
		validationRules: [depthLimit(10)],
		context: async ({ req }) => {
			mockApplicationServicesFactory ??= createMockApplicationServicesFactory(getMongooseService());
			const applicationServices = await mockApplicationServicesFactory.forRequest(req.headers.authorization ?? undefined);
			if (!applicationServices) {
				throw new Error('ApplicationServicesFactory required for test server');
			}
			return { applicationServices };
		},
	});
}

export function resetApiGraphQLServerFactories(): void {
	mockApplicationServicesFactory = undefined;
}
