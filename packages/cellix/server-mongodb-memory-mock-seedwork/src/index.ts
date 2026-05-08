import { MongoMemoryReplSet } from 'mongodb-memory-server';

export interface MongoMemoryReplicaSetConfig {
	port: number;
	dbName: string;
	replSetName: string;
	binaryVersion?: string;
}

export interface MongoMemoryReplicaSetDisposer {
	stop: () => Promise<void>;
}

export async function startMongoMemoryReplicaSet(config: MongoMemoryReplicaSetConfig): Promise<{ replicaSet: MongoMemoryReplSet; disposer: MongoMemoryReplicaSetDisposer }> {
	const replicaSet = await MongoMemoryReplSet.create({
		binary: { version: config.binaryVersion ?? '7.0.14' },
		replSet: {
			name: config.replSetName,
			count: 1,
			storageEngine: 'wiredTiger',
		},
		instanceOpts: [{ port: config.port }],
	});

	const disposer: MongoMemoryReplicaSetDisposer = {
		stop: async () => {
			await replicaSet.stop();
		},
	};

	return { replicaSet, disposer };
}
