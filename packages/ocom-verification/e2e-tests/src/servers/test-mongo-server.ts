import { MongoMemoryProcessTestServer } from '@cellix/serenity-framework/servers';
import { getMongoPort } from '@ocom-verification/verification-shared/environment';
import { seedDatabase } from '@ocom-verification/verification-shared/test-data';
import { appPaths } from '../shared/environment/app-paths.ts';
import { getPortlessDevScript } from '../shared/environment/dev-script.ts';

const mongoDbName = 'owner-community';
const mongoReplSetName = 'globaldb';

export const testMongoServer = new MongoMemoryProcessTestServer({
	connectionString: mongoConnectionString,
	cwd: appPaths.mongodbMemoryMockDir,
	dbName: mongoDbName,
	executable: 'pnpm',
	portsToCloseBeforeStart: getMongoPort,
	probe: false,
	readyMarker: 'MongoDB Memory Replica Set ready at:',
	seedData: seedDatabase,
	serverName: 'TestMongoMemoryServer',
	spawnArgs: () => ['run', getPortlessDevScript()],
});

function mongoConnectionString(): string {
	return `mongodb://127.0.0.1:${getMongoPort()}/${mongoDbName}?replicaSet=${mongoReplSetName}`;
}
