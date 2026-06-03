import { ApolloGraphQLTestServer, type TestServer } from '@cellix/serenity-framework/servers';
import type { ApplicationServices } from '@ocom/application-services';
import { combinedSchema } from '@ocom/graphql';
import type { ServiceMongoose } from '@ocom/service-mongoose';
import depthLimit from 'graphql-depth-limit';
import { applyMiddleware } from 'graphql-middleware';
import { createMockApplicationServicesFactory } from './mock-application-services.ts';

/**
 * {@link TestServer} adapter that owns the Mongoose connection lifecycle for the
 * acceptance suite. The framework is database-ignorant, so connecting, clearing
 * registered models, and disconnecting all live here. Exposes the started
 * {@link ServiceMongoose} to dependent servers (e.g. the GraphQL server) via
 * {@link getService}.
 */
export class MongooseTestServer implements TestServer {
	private serviceInternal: ServiceMongoose | undefined;

	constructor(private readonly createService: () => ServiceMongoose) {}

	async start(): Promise<void> {
		const service = this.createService();
		await service.startUp();
		// Clear any models registered on a previous connection so schemas re-register cleanly.
		const { connection } = service.service;
		for (const modelName of Object.keys(connection.models)) {
			try {
				connection.deleteModel(modelName);
			} catch {
				/* already deleted */
			}
		}
		this.serviceInternal = service;
	}

	async stop(): Promise<void> {
		if (this.serviceInternal) {
			await this.serviceInternal.shutDown();
			this.serviceInternal = undefined;
		}
	}

	isRunning(): boolean {
		return this.serviceInternal !== undefined;
	}

	/** Not a network server; no URL is exposed. */
	getUrl(): string {
		return '';
	}

	/** The started Mongoose service. Throws if accessed before {@link start}. */
	getService(): ServiceMongoose {
		if (!this.serviceInternal) {
			throw new Error('MongooseTestServer not started');
		}
		return this.serviceInternal;
	}
}

/**
 * {@link TestServer} that owns the Apollo GraphQL server lifecycle for the
 * acceptance suite. It wires the app's schema and permissions middleware and
 * builds a request-scoped mock application-services factory lazily on the first
 * request, caching it for the lifetime of the running server. The cache is
 * instance-scoped, so it is discarded when the server stops.
 */
export class ApiGraphQLTestServer implements TestServer {
	private readonly server: ApolloGraphQLTestServer<{ applicationServices: ApplicationServices }>;
	private applicationServicesFactory: ReturnType<typeof createMockApplicationServicesFactory> | undefined;

	constructor(getMongooseService: () => ServiceMongoose) {
		this.server = new ApolloGraphQLTestServer<{ applicationServices: ApplicationServices }>({
			schema: applyMiddleware(combinedSchema),
			validationRules: [depthLimit(10)],
			context: async ({ req }) => {
				this.applicationServicesFactory ??= createMockApplicationServicesFactory(getMongooseService());
				const applicationServices = await this.applicationServicesFactory.forRequest(req.headers.authorization ?? undefined);
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
