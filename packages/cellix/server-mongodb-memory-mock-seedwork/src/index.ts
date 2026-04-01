import { MongoMemoryReplSet } from 'mongodb-memory-server';

export interface MongoMemoryReplicaSetConfig {
	port: number;
	dbName: string;
	replSetName: string;
	binaryVersion?: string;
}

export async function startMongoMemoryReplicaSet(config: MongoMemoryReplicaSetConfig) {
	console.log('Starting MongoDB Memory Replica Set', {
		port: config.port,
		dbName: config.dbName,
		replSetName: config.replSetName,
	});

	const replicaSet = await MongoMemoryReplSet.create({
		binary: { version: config.binaryVersion ?? '7.0.14' },
		replSet: {
			name: config.replSetName,
			count: 1,
			storageEngine: 'wiredTiger',
		},
		instanceOpts: [{ port: config.port }],
	});

	const uri = replicaSet.getUri(config.dbName);
	console.log('MongoDB Memory Replica Set ready at:', uri);
	return replicaSet;
}
