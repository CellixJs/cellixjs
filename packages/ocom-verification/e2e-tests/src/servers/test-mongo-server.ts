import { MongoMemoryProcessTestServer } from '@cellix/serenity-framework/servers';
import { getMongoPort } from '@ocom-verification/verification-shared/environment';
import { seedDatabase } from '@ocom-verification/verification-shared/test-data';
import { appPaths } from '../shared/environment/app-paths.ts';

export const mongoDbName = 'owner-community';
const mongoReplSetName = 'globaldb';

export const testMongoServer = new MongoMemoryProcessTestServer({
	connectionString: mongoConnectionString(),
	cwd: appPaths.mongodbMemoryMockDir,
	dbName: mongoDbName,
	// The suite owns seeding and per-scenario resets; the mock's built-in dev
	// seed would race scenarios and overwrite suite-seeded users by _id.
	env: { SKIP_DEV_SEED: 'true' },
	executable: 'pnpm',
	portsToCloseBeforeStart: getMongoPort,
	readyMarker: 'MongoDB Memory Replica Set ready at:',
	seedData: seedDatabase,
	serverName: 'TestMongoMemoryServer',
	spawnArgs: () => ['run', process.env.WORKTREE_NAME ? 'dev:worktree' : 'dev'],
});

export function mongoConnectionString(): string {
	return `mongodb://127.0.0.1:${getMongoPort()}/${mongoDbName}?replicaSet=${mongoReplSetName}`;
}
