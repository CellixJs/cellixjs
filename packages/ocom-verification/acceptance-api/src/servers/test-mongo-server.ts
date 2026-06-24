import { MongoMemoryProcessTestServer } from '@cellix/serenity-framework/servers';
import { getMongoPort } from '@ocom-verification/verification-shared/environment';
import { seedDatabase } from '@ocom-verification/verification-shared/test-data';
import { mongodbMemoryMockDir } from './paths.ts';

export const mongoDbName = 'owner-community';
const mongoReplSetName = 'globaldb';

export const testMongoServer = new MongoMemoryProcessTestServer({
	connectionString: mongoConnectionString(),
	cwd: mongodbMemoryMockDir,
	dbName: mongoDbName,
	executable: 'pnpm',
	portsToCloseBeforeStart: getMongoPort,
	readyMarker: 'MongoDB Memory Replica Set ready at:',
	seedData: seedDatabase,
	serverName: 'TestMongoMemoryServer',
	spawnArgs: () => ['run', getDevScript()],
});

function getDevScript(): 'dev' | 'dev:worktree' {
	return process.env['WORKTREE_NAME'] ? 'dev:worktree' : 'dev';
}

function mongoConnectionString(): string {
	return `mongodb://127.0.0.1:${getMongoPort()}/${mongoDbName}?replicaSet=${mongoReplSetName}`;
}
