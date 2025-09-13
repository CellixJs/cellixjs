import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { setupEnvironment } from './setup-environment.js';

setupEnvironment();
// biome-ignore lint:useLiteralKeys
const port = Number(process.env['PORT'] ?? 50000);
// biome-ignore lint:useLiteralKeys
const dbName = process.env['DB_NAME'] ?? 'test';
// biome-ignore lint:useLiteralKeys
const replSetName = process.env['REPL_SET_NAME'] ?? 'rs0';

console.log('Starting MongoDB Memory Replica Set', {
	port,
	dbName,
	replSetName,
});

await MongoMemoryReplSet.create({
    binary: { version: '7.0.14' },
    replSet: {
        name: replSetName,
        count: 1,
        storageEngine: 'wiredTiger',
    },
    instanceOpts: [{ port }],
})
.then((replicaSet) => {
    const uri = replicaSet.getUri(dbName);
    console.log('MongoDB Memory Replica Set ready at:', uri);
})
.catch((err) => {
    console.error('Error starting MongoDB Memory Replica Set:', err);
    process.exit(1);
});
