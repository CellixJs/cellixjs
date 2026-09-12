import { type MongoMemoryServerConfig, startMockMongoDB } from '@cellix/server-mongodb-memory-mock-seedwork';
import { seedDatabase } from './seed/seed.ts';
import { setupEnvironment } from './setup-environment.ts';

setupEnvironment();

const collectionsToSeed = ['users', 'communities', 'roles', 'members', 'properties', 'services'];

const { PORT, DB_NAME, REPL_SET_NAME, SKIP_DEV_SEED } = process.env;

const port = Number(PORT ?? 50000);
const dbName = DB_NAME ?? 'owner-community';
const replSetName = REPL_SET_NAME ?? 'globaldb';
// Test suites seed and reset the database themselves; the built-in dev seed
// would otherwise fire once all collections exist and overwrite suite-managed
// documents that reuse the same _ids mid-scenario.
const skipDevSeed = SKIP_DEV_SEED === 'true';

const config: MongoMemoryServerConfig = {
	...(skipDevSeed ? {} : { collectionsToSeed, seedDatabase }),
	port,
	dbName,
	replSetName,
};

startMockMongoDB(config).catch((err: unknown) => {
	console.error('Failed to start mock MongoDB:', err);
	process.exit(1);
});
