import { ApiInfrastructure } from '@cellix/serenity-framework/infrastructure/api';
import { MongoMemoryTestServer } from '@cellix/serenity-framework/servers';
import { ServiceMongoose } from '@ocom/service-mongoose';
import { getMongoPort } from '@ocom-verification/verification-shared/environment';
import { seedDatabase } from '@ocom-verification/verification-shared/test-data';
import { ApiGraphQLTestServer, MongooseTestServer } from './test-server-factories.ts';

const apiDbName = 'owner-community';

const infrastructure = ApiInfrastructure.create()
	.addServer('mongo', () => new MongoMemoryTestServer({ dbName: apiDbName, port: getMongoPort(), replSetName: 'globaldb', seedData: seedDatabase }), {
		resetForScenario: (server) => (server as MongoMemoryTestServer).resetForScenario(),
	})
	.addServer('mongoose', (ctx) => new MongooseTestServer(() => new ServiceMongoose(ctx.server<MongoMemoryTestServer>('mongo').getConnectionString(), { autoCreate: true, autoIndex: true, dbName: apiDbName })), {
		dependsOn: ['mongo'],
	})
	.addServer('graphql', (ctx) => new ApiGraphQLTestServer(() => ctx.server<MongooseTestServer>('mongoose').getService()), { dependsOn: ['mongoose'] });

interface ApiAcceptanceState {
	graphqlUrl: string | undefined;
}

export function getState(): ApiAcceptanceState {
	// biome-ignore lint:useLiteralKeys - servers is an index-signature record; bracket access required by noPropertyAccessFromIndexSignature
	const graphqlServer = infrastructure.getState().servers['graphql'];
	return {
		graphqlUrl: graphqlServer?.isRunning() ? graphqlServer.getUrl() : undefined,
	};
}

export async function stopAll(): Promise<void> {
	await infrastructure.stopAll();
}

export async function ensureApiServers(): Promise<void> {
	infrastructure.registerProcessShutdownHandlers();
	await infrastructure.ensureStarted();
}

export async function resetMongoForScenario(): Promise<void> {
	await infrastructure.resetScenarioState();
}
