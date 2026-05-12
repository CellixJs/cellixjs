import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import type { ApplicationServices, ApplicationServicesFactory } from '@ocom/application-services';
import { combinedSchema } from '@ocom/graphql';
import depthLimit from 'graphql-depth-limit';
import { applyMiddleware } from 'graphql-middleware';

interface GraphContext {
	applicationServices: ApplicationServices;
}

const MAX_QUERY_DEPTH = 10;

// In-process Apollo Server for API acceptance and integration tests
export class GraphQLTestServer {
	private server: ApolloServer<GraphContext> | null = null;
	private url: string | null = null;

	constructor(private readonly applicationServicesFactory?: ApplicationServicesFactory) {}

	async start(port = 0): Promise<string> {
		if (this.server) {
			throw new Error('Test server already started');
		}

		const securedSchema = applyMiddleware(combinedSchema);

		this.server = new ApolloServer<GraphContext>({
			schema: securedSchema,
			allowBatchedHttpRequests: true,
			validationRules: [depthLimit(MAX_QUERY_DEPTH)],
			introspection: false,
		});

		const { url } = await startStandaloneServer(this.server, {
			listen: { port },
			context: async ({ req }) => {
				const authHeader = req.headers.authorization ?? undefined;

				const applicationServices = this.applicationServicesFactory ? await this.applicationServicesFactory.forRequest(authHeader) : undefined;

				if (!applicationServices) {
					throw new Error('ApplicationServicesFactory required for test server');
				}

				return {
					applicationServices,
				};
			},
		});

		this.url = url;
		return url;
	}

	async stop(): Promise<void> {
		if (!this.server) {
			return;
		}

		await this.server.stop();
		this.server = null;
		this.url = null;
	}

	getUrl(): string {
		if (!this.url) {
			throw new Error('Test server not started');
		}
		return this.url;
	}

	isRunning(): boolean {
		return this.server !== null;
	}
}
