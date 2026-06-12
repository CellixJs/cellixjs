import { GraphQLTestServer, MongoDBTestServer } from '@ocom-verification/verification-shared/servers';
import { createMockApplicationServicesFactory } from './application-services/index.ts';

// Shared infrastructure — persists across scenarios within a single test run
let mongoDBServer: MongoDBTestServer | undefined;
let graphQLServer: GraphQLTestServer | undefined;
let apiUrl: string | undefined;

interface InfrastructureState {
	apiUrl: string | undefined;
}

export function getState(): InfrastructureState {
	return { apiUrl };
}

export async function stopAll(): Promise<void> {
	if (graphQLServer) {
		await graphQLServer.stop();
		graphQLServer = undefined;
	}
	if (mongoDBServer) {
		await mongoDBServer.stop();
		mongoDBServer = undefined;
	}
	apiUrl = undefined;
}

async function ensureMongoDBServer(): Promise<MongoDBTestServer> {
	if (mongoDBServer) return mongoDBServer;

	mongoDBServer = new MongoDBTestServer();
	await mongoDBServer.start({ attachMongoose: true });
	return mongoDBServer;
}

export async function ensureApiServers(): Promise<void> {
	if (graphQLServer) return;

	const mongo = await ensureMongoDBServer();

	const mockApplicationServicesFactory = createMockApplicationServicesFactory(mongo.getServiceMongoose());
	graphQLServer = new GraphQLTestServer(mockApplicationServicesFactory);
	await graphQLServer.start();
	apiUrl = graphQLServer.getUrl();
}

export async function resetMongoForScenario(): Promise<void> {
	if (!mongoDBServer) return;
	await mongoDBServer.resetForScenario();
}
