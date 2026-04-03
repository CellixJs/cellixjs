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

	const shutdown = async (signal?: string, exitCode = 0) => {
		try {
			console.log(`Shutting down MongoDB memory replica set (${signal ?? 'signal'})`);
			await disposer.stop();
		} catch (err) {
			console.error('Error during MongoDB replica set shutdown:', err);
		} finally {
			// Exit with provided code so CI can detect crash paths when appropriate
			process.exit(exitCode);
		}
	};

	process.once('SIGINT', () => void shutdown('SIGINT'));
	process.once('SIGTERM', () => void shutdown('SIGTERM'));
	process.once('SIGQUIT', () => void shutdown('SIGQUIT'));
	process.once('uncaughtException', async (err) => {
		console.error('Uncaught exception, shutting down:', err);
		await shutdown('uncaughtException', 1);
	});
	process.once('unhandledRejection', async (reason) => {
		console.error('Unhandled rejection, shutting down:', reason);
		await shutdown('unhandledRejection', 1);
	});
} catch (error: unknown) {
	console.error('Failed to start MongoDB memory replica set:', error);
	process.exit(1);
}
