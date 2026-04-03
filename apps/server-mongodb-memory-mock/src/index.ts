import { startMongoMemoryReplicaSet, type MongoMemoryReplicaSetConfig } from '@cellix/server-mongodb-memory-mock-seedwork';
import { setupEnvironment } from './setup-environment.ts';

setupEnvironment();

const { PORT, DB_NAME, REPL_SET_NAME } = process.env;

const config: MongoMemoryReplicaSetConfig = {
	port: Number(PORT ?? 50000),
	dbName: DB_NAME ?? 'owner-community',
	replSetName: REPL_SET_NAME ?? 'globaldb',
};

// Start replica set and wire disposer into process shutdown handlers
try {
	const { disposer } = await startMongoMemoryReplicaSet(config);

	const shutdown = async (signal?: string) => {
		try {
			console.log(`Shutting down MongoDB memory replica set (${signal ?? 'signal'})`);
			await disposer.stop();
		} catch (err) {
			console.error('Error during MongoDB replica set shutdown:', err);
		} finally {
			// Ensure process exits after cleanup
			process.exit(0);
		}
	};

	process.once('SIGINT', () => void shutdown('SIGINT'));
	process.once('SIGTERM', () => void shutdown('SIGTERM'));
	process.once('SIGQUIT', () => void shutdown('SIGQUIT'));
	process.once('uncaughtException', async (err) => {
		console.error('Uncaught exception, shutting down:', err);
		await shutdown('uncaughtException');
	});
	process.once('unhandledRejection', async (reason) => {
		console.error('Unhandled rejection, shutting down:', reason);
		await shutdown('unhandledRejection');
	});

} catch (error: unknown) {
	console.error('Failed to start MongoDB memory replica set:', error);
	process.exit(1);
}
