import { startMongoMemoryReplicaSet, type MongoMemoryReplicaSetConfig } from '@cellix/server-mongodb-memory-mock-seedwork';
import { setupEnvironment } from './setup-environment.ts';

setupEnvironment();

const { PORT, DB_NAME, REPL_SET_NAME } = process.env;

const config: MongoMemoryReplicaSetConfig = {
	port: Number(PORT ?? 50000),
	dbName: DB_NAME ?? 'owner-community',
	replSetName: REPL_SET_NAME ?? 'globaldb',
};

startMongoMemoryReplicaSet(config).catch((error: unknown) => {
	console.error('Failed to start MongoDB memory replica set:', error);
	process.exit(1);
});
