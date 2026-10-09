import { ApolloGraphQLTestServer, type TestServer } from '@cellix/serenity-framework/servers';
import type { ApplicationServices } from '@ocom/application-services';
import { combinedSchema } from '@ocom/graphql';
import depthLimit from 'graphql-depth-limit';
import { applyMiddleware } from 'graphql-middleware';
import { createMockApplicationServicesFactory } from '../mock-application-services.ts';
import { mongooseTestServer } from './mongoose-test-server.ts';

/**
 * {@link TestServer} that owns the Apollo GraphQL server lifecycle for the
 * acceptance suite.
 */
class ApiGraphQLTestServer implements TestServer {
	private readonly server: ApolloGraphQLTestServer<{ applicationServices: ApplicationServices }>;
	private applicationServicesFactory: ReturnType<typeof createMockApplicationServicesFactory> | undefined;

	constructor() {
		this.server = new ApolloGraphQLTestServer<{ applicationServices: ApplicationServices }>({
			schema: applyMiddleware(combinedSchema),
			validationRules: [depthLimit(10)],
			context: async ({ req }) => {
				this.applicationServicesFactory ??= createMockApplicationServicesFactory(mongooseTestServer.getService());
				// Mirror the production graphql-handler: principal hints travel as
				// x-member-id / x-community-id headers alongside the auth token.
				const headerValue = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);
				const applicationServices = await this.applicationServicesFactory.forRequest(req.headers.authorization ?? undefined, {
					memberId: headerValue(req.headers['x-member-id']),
					communityId: headerValue(req.headers['x-community-id']),
				});
				if (!applicationServices) {
					throw new Error('ApplicationServicesFactory required for test server');
				}
				return { applicationServices };
			},
		});
	}

	start(): Promise<void> {
		return this.server.start();
	}

	async stop(): Promise<void> {
		await this.server.stop();
		this.applicationServicesFactory = undefined;
	}

	isRunning(): boolean {
		return this.server.isRunning();
	}

	getUrl(): string {
		return this.server.getUrl();
	}
}

export const apiGraphQLTestServer = new ApiGraphQLTestServer();
