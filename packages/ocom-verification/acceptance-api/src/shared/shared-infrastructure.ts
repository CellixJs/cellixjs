import { ApiInfrastructure, type ApiInfrastructureState } from '@cellix/serenity-framework/infrastructure/api';
import type { ServiceMongoose } from '@ocom/service-mongoose';
import { seedDatabase } from '@ocom-verification/verification-shared/test-data';
import { createApiGraphQLServer, createApiMongooseService, resetApiGraphQLServerFactories } from './test-server-factories.ts';

const apiDbName = 'owner-community';

const infrastructure = ApiInfrastructure.using<ServiceMongoose>({
	createApiServer: ({ getMongooseService }) => createApiGraphQLServer(getMongooseService),
	mongoServer: {
		dbName: apiDbName,
		port: 50_000,
		replSetName: 'globaldb',
		seedData: seedDatabase,
	},
	mongoose: {
		createService: (connectionString) => createApiMongooseService(connectionString, apiDbName),
	},
});

interface InfrastructureState extends ApiInfrastructureState<ServiceMongoose> {}

export function getState(): InfrastructureState {
	return infrastructure.getState();
}

export async function stopAll(): Promise<void> {
	await infrastructure.stopAll();
	resetApiGraphQLServerFactories();
}

export async function ensureApiServers(): Promise<void> {
	infrastructure.registerProcessShutdownHandlers();
	await infrastructure.ensureStarted();
}

export async function resetMongoForScenario(): Promise<void> {
	await infrastructure.resetScenarioState();
}
