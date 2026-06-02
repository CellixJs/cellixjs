import { ApolloServer, type BaseContext } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import type { GraphQLSchema, ValidationRule } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import type { TestServer } from './test-server.ts';

const MAX_QUERY_DEPTH = 25;

/** Options used by {@link ApolloGraphQLTestServer}. */
export interface ApolloGraphQLTestServerOptions<TContext extends BaseContext> {
	/** GraphQL schema served by Apollo. */
	schema: GraphQLSchema;

	/** Context factory passed to Apollo's standalone server. */
	context: Parameters<typeof startStandaloneServer<TContext>>[1]['context'];

	/** Optional GraphQL validation rules. */
	validationRules?: ValidationRule[];

	/** Whether batched HTTP requests are allowed. Defaults to `true`. */
	allowBatchedHttpRequests?: boolean;

	/** Whether Apollo introspection is enabled. Defaults to `false`. */
	introspection?: boolean;
}

/**
 * Generic in-process Apollo GraphQL server for acceptance tests.
 *
 * Consumers provide schema, context, validation rules, and app-specific service
 * factories from outside the Cellix framework package.
 */
export class ApolloGraphQLTestServer<TContext extends BaseContext> implements TestServer {
	private server: ApolloServer<TContext> | null = null;
	private url: string | null = null;

	/**
	 * @param options Apollo server contract supplied by the consumer.
	 */
	constructor(private readonly options: ApolloGraphQLTestServerOptions<TContext>) {}

	/**
	 * Start the GraphQL server on the specified port, or a random port by default.
	 *
	 * @param port TCP port. Use `0` for any available port.
	 */
	async start(port = 0): Promise<void> {
		if (this.server) {
			throw new Error('ApolloGraphQLTestServer already started');
		}

		this.server = new ApolloServer<TContext>({
			allowBatchedHttpRequests: this.options.allowBatchedHttpRequests ?? true,
			introspection: this.options.introspection ?? false,
			schema: this.options.schema,
			validationRules: [depthLimit(MAX_QUERY_DEPTH), ...(this.options.validationRules ?? [])],
		});

		const { url } = await startStandaloneServer(this.server, {
			context: this.options.context,
			listen: { port },
		});

		this.url = url;
	}

	/** Stop the Apollo server. */
	async stop(): Promise<void> {
		if (!this.server) {
			return;
		}

		await this.server.stop();
		this.server = null;
		this.url = null;
	}

	/**
	 * Return the server URL.
	 *
	 * @throws Error when the server has not started.
	 */
	getUrl(): string {
		if (!this.url) {
			throw new Error('ApolloGraphQLTestServer not started');
		}
		return this.url;
	}

	/** Return whether the server is active. */
	isRunning(): boolean {
		return this.server !== null;
	}
}
