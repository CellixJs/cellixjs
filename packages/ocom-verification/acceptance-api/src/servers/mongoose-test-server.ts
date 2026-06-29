import type { TestServer } from '@cellix/serenity-framework/servers';
import { mongooseContextBuilder } from '@ocom/data-sources-mongoose-models';
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

		// Pre-create all collections before any test transaction runs. Without this,
		// the first transaction that writes to a not-yet-created collection triggers a
		// MongoDB TransientTransactionError ("catalog changes"), which causes Mongoose to
		// retry the transaction callback. On retry the arguments may be in an unexpected
		// state, leading to hard-to-diagnose failures in CI.
		const models = mongooseContextBuilder(service);
		await Promise.all(Object.values(models).map((model) => model.createCollection()));

		// Clear all models so schemas re-register cleanly when the application layer
		// accesses them for the first time (avoids "model already defined" errors when
		// the test server is stopped and restarted across scenarios).
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
