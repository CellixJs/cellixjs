import { type MongoMemoryServerConfig, startMockMongoDB } from '@cellix/server-mongodb-memory-mock-seedwork';
import { seedDatabase } from './seed/seed.ts';
import { setupEnvironment } from './setup-environment.ts';

setupEnvironment();

const collectionsToSeed = ['users', 'communities', 'roles', 'members', 'properties', 'services'];

const { PORT, DB_NAME, REPL_SET_NAME } = process.env;

const port = Number(PORT ?? 50000);
const dbName = DB_NAME ?? 'owner-community';
const replSetName = REPL_SET_NAME ?? 'globaldb';

const config: MongoMemoryServerConfig = {
	collectionsToSeed,
	seedDatabase,
	port,
	dbName,
	replSetName,
};

startMockMongoDB(config).catch((err: unknown) => {
	console.error('Failed to start mock MongoDB:', err);
	process.exit(1);
});
