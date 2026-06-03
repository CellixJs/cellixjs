import { E2EInfrastructure, type E2EInfrastructureState } from '@cellix/serenity-framework/infrastructure/e2e';
import { MongoMemoryTestServer } from '@cellix/serenity-framework/servers';
import { getMongoPort } from '@ocom-verification/verification-shared/environment';
import { seedDatabase } from '@ocom-verification/verification-shared/test-data';
import type { BrowserContext } from 'playwright';
import { cleanupTestEnvironment, createCommunityUiPortalServer, createStaffUiPortalServer, createTestApiServer, createTestAzuriteServer, createTestOAuth2Server, initTestEnvironment } from './test-server-factories.ts';

const apiDbName = 'owner-community';

const infrastructure = E2EInfrastructure.create({
	// baseURL is supplied per portal by the framework; only shared options here.
	browserContextOptions: { ignoreHTTPSErrors: true },
	cleanupEnvironment: cleanupTestEnvironment,
	setupEnvironment: initTestEnvironment,
})
	.addServer('mongo', () => new MongoMemoryTestServer({ dbName: apiDbName, port: getMongoPort(), replSetName: 'globaldb', seedData: seedDatabase }), {
		resetForScenario: (server) => (server as MongoMemoryTestServer).resetForScenario(),
	})
	.addServer('azurite', () => createTestAzuriteServer())
	.addServer('auth', () => createTestOAuth2Server())
	.addServer('api', (ctx) => createTestApiServer(() => ctx.server<MongoMemoryTestServer>('mongo').getConnectionString()), { dependsOn: ['mongo'] })
	.addUiPortal('community', () => createCommunityUiPortalServer())
	.addUiPortal('staff', () => createStaffUiPortalServer());

export function getState(): E2EInfrastructureState {
	return infrastructure.getState();
}

export function newPortalContext(site: 'community' | 'staff'): Promise<BrowserContext> {
	return infrastructure.newPortalContext(site);
}

export async function resetScenarioState(): Promise<void> {
	await infrastructure.resetScenarioState();
}

export async function stopAll(): Promise<void> {
	await infrastructure.stopAll();
}

export async function ensureE2EServers(): Promise<void> {
	infrastructure.registerProcessShutdownHandlers();
	await infrastructure.ensureStarted();
}
