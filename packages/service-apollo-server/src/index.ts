import { ApolloServer } from '@apollo/server';
import type { ServiceBase } from '@cellix/api-services-spec';
import type { BaseContext } from '@apollo/server';
import type { GraphQLSchemaWithFragmentReplacements } from 'graphql-middleware/types';

export interface ServiceApolloServerOptions {
	/**
	 * The GraphQL schema to use with the Apollo Server.
	 * This should be the combined and secured schema.
	 */
	schema: GraphQLSchemaWithFragmentReplacements;
	
	/**
	 * CORS configuration for the Apollo Server
	 */
	cors?: {
		origin?: boolean | string | string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
		credentials?: boolean;
	};
	
	/**
	 * Whether to allow batched HTTP requests
	 * @default true
	 */
	allowBatchedHttpRequests?: boolean;
	
	/**
	 * Additional Apollo Server configuration options
	 */
	additionalOptions?: Record<string, unknown>;
}

export interface ApolloServerProvider<TContext extends BaseContext = BaseContext> {
	/**
	 * Get the initialized Apollo Server instance
	 */
	get server(): ApolloServer<TContext>;
}

export class ServiceApolloServer<TContext extends BaseContext = BaseContext>
	implements 
		ServiceBase<ApolloServerProvider<TContext>>,
		ApolloServerProvider<TContext>
{
	private readonly options: ServiceApolloServerOptions;
	private serverInternal: ApolloServer<TContext> | undefined;

	constructor(options: ServiceApolloServerOptions) {
		if (!options.schema) {
			throw new Error('GraphQL schema is required for Apollo Server service');
		}
		this.options = {
			cors: {
				origin: true,
				credentials: true,
			},
			allowBatchedHttpRequests: true,
			...options,
		};
	}

	public async startUp(): Promise<ApolloServerProvider<TContext>> {
		const serverConfig = {
			schema: this.options.schema,
			...(this.options.cors && { cors: this.options.cors }),
			...(typeof this.options.allowBatchedHttpRequests === 'boolean' && { 
				allowBatchedHttpRequests: this.options.allowBatchedHttpRequests 
			}),
			...this.options.additionalOptions,
		};

		this.serverInternal = new ApolloServer<TContext>(serverConfig);
		
		// Start the server - this is synchronous but we wrap in async for interface compliance
		this.serverInternal.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();
		
		// Add a small delay to ensure server is started
		await new Promise(resolve => setTimeout(resolve, 10));
		
		console.log('ServiceApolloServer started');
		return this;
	}

	public async shutDown(): Promise<void> {
		if (!this.serverInternal) {
			throw new Error(
				'ServiceApolloServer is not started - shutdown cannot proceed',
			);
		}
		await this.serverInternal.stop();
		console.log('ServiceApolloServer stopped');
	}

	public get server(): ApolloServer<TContext> {
		if (!this.serverInternal) {
			throw new Error('ServiceApolloServer is not started - cannot access server');
		}
		return this.serverInternal;
	}
}