import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import type { ApplicationServices, ApplicationServicesFactory } from '@ocom/application-services';
import { combinedSchema } from '@ocom/graphql';
import depthLimit from 'graphql-depth-limit';
import { applyMiddleware } from 'graphql-middleware';
import { getTimeout } from '../settings/index.ts';
import type { TestServer } from './test-server.interface.ts';

interface GraphContext {
	applicationServices: ApplicationServices;
}

const MAX_QUERY_DEPTH = 10;

/**
 * In-process Apollo Server for API acceptance and integration tests.
 *
 * This server runs the GraphQL schema directly in the test process,
 * providing fast feedback with mocked application services.
 *
 * Use this for:
 * - API acceptance tests
 * - Unit-like integration tests
 * - Fast feedback loops
 *
 * For full system tests, use PortlessServer-based implementations instead.
 */
export class GraphQLTestServer implements TestServer {
	private server: ApolloServer<GraphContext> | null = null;
	private url: string | null = null;

	constructor(private readonly applicationServicesFactory?: ApplicationServicesFactory) {}

	/**
	 * Start the GraphQL server on the specified port (or random port if 0).
	 * Uses centralized timeout configuration.
	 */
	async start(port = 0): Promise<void> {
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

		const timeoutMs = getTimeout('serverStartup');
		const startTime = Date.now();

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

		const elapsed = Date.now() - startTime;
		if (elapsed > timeoutMs * 0.8) {
			console.warn(`GraphQLTestServer startup took ${elapsed}ms (timeout: ${timeoutMs}ms)`);
		}

		this.url = url;
	}

	/**
	 * Stop the server gracefully.
	 */
	async stop(): Promise<void> {
		if (!this.server) {
			return;
		}

		await this.server.stop();
		this.server = null;
		this.url = null;
	}

	/**
	 * Get the server URL.
	 * @throws Error if server is not running
	 */
	getUrl(): string {
		if (!this.url) {
			throw new Error('Test server not started');
		}
		return this.url;
	}

	/**
	 * Check if server is currently running.
	 */
	isRunning(): boolean {
		return this.server !== null;
	}
}
