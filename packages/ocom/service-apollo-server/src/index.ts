import { ApolloServer, type BaseContext } from '@apollo/server';
import type { ServiceBase } from '@cellix/api-services-spec';
import { trace, type Tracer, type Span, SpanStatusCode } from '@opentelemetry/api';
import depthLimit from 'graphql-depth-limit';
import { applyMiddleware } from 'graphql-middleware';
import type { GraphQLSchema } from 'graphql';

/**
 * Configuration options for the Apollo Server service.
 */
export interface ServiceApolloServerOptions {
	/**
	 * The GraphQL schema to serve.
	 */
	schema: GraphQLSchema;

	/**
	 * Optional middleware to apply to the schema (e.g., permissions).
	 */
	middleware?: unknown;

	/**
	 * Enable GraphQL introspection.
	 * @default false in production, true in development
	 */
	introspection?: boolean;

	/**
	 * Allow batched HTTP requests.
	 * @default true
	 */
	allowBatchedHttpRequests?: boolean;

	/**
	 * Maximum query depth allowed.
	 * @default 10
	 */
	maxDepth?: number;
}

/**
 * Apollo Server infrastructure service following the Cellix ServiceBase pattern.
 * Manages the Apollo Server lifecycle with startUp/shutDown hooks.
 */
export class ServiceApolloServer<TContext extends BaseContext = BaseContext>
	implements ServiceBase<ApolloServer<TContext>>
{
	private serverInternal: ApolloServer<TContext> | undefined;
	private readonly options: ServiceApolloServerOptions;
	private readonly tracer: Tracer = trace.getTracer('service-apollo-server');

	constructor(options: ServiceApolloServerOptions) {
		this.options = options;
	}

	/**
	 * Initializes and starts the Apollo Server.
	 * Creates the server instance with the configured schema and options.
	 */
	public async startUp(): Promise<ApolloServer<TContext>> {
		return await this.tracer.startActiveSpan('ServiceApolloServer.startUp', async (span: Span) => {
			try {
				const {
					schema,
					middleware,
					introspection = process.env.NODE_ENV !== 'production',
					allowBatchedHttpRequests = true,
					maxDepth = 10,
				} = this.options;

				// Apply middleware if provided
				const finalSchema = middleware
					? applyMiddleware(schema, middleware)
					: schema;

				this.serverInternal = new ApolloServer<TContext>({
					schema: finalSchema,
					introspection,
					allowBatchedHttpRequests,
					validationRules: [depthLimit(maxDepth)],
				});

				// Start the server in the background
				await this.serverInternal.start();

				span.addEvent('ServiceApolloServer started');
				span.setStatus({ code: SpanStatusCode.OK });
				return this.serverInternal;
			} catch (error) {
				span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Startup failed' });
				if (error instanceof Error) {
					span.recordException(error);
				}
				throw error;
			} finally {
				span.end();
			}
		});
	}

	/**
	 * Stops the Apollo Server.
	 */
	public async shutDown(): Promise<void> {
		return await this.tracer.startActiveSpan('ServiceApolloServer.shutDown', async (span: Span) => {
			try {
				if (!this.serverInternal) {
					throw new Error(
						'ServiceApolloServer is not started - shutdown cannot proceed',
					);
				}

				await this.serverInternal.stop();
				this.serverInternal = undefined;

				span.addEvent('ServiceApolloServer stopped');
				span.setStatus({ code: SpanStatusCode.OK });
			} catch (error) {
				span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Shutdown failed' });
				if (error instanceof Error) {
					span.recordException(error);
				}
				throw error;
			} finally {
				span.end();
			}
		});
	}

	/**
	 * Gets the Apollo Server instance.
	 * @throws Error if the service has not been started.
	 */
	public get server(): ApolloServer<TContext> {
		if (!this.serverInternal) {
			throw new Error(
				'ServiceApolloServer is not started - cannot access server',
			);
		}
		return this.serverInternal;
	}
}
