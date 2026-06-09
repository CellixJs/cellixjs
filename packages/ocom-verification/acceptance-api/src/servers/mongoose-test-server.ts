import type { TestServer } from '@cellix/serenity-framework/servers';
import { ServiceMongoose } from '@ocom/service-mongoose';
import { mongoDbName, testMongoServer } from './test-mongo-server.ts';

/**
 * {@link TestServer} adapter that owns the Mongoose connection lifecycle for the
 * acceptance suite.
 */
class MongooseTestServer implements TestServer {
	private serviceInternal: ServiceMongoose | undefined;

	async start(): Promise<void> {
		const service = new ServiceMongoose(testMongoServer.getConnectionString(), { autoCreate: true, autoIndex: true, dbName: mongoDbName });
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

export const mongooseTestServer = new MongooseTestServer();
