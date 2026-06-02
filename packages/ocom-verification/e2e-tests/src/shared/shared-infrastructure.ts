import { E2EInfrastructure, type E2EInfrastructureState } from '@cellix/serenity-framework/infrastructure/e2e';
import { seedDatabase } from '@ocom-verification/verification-shared/test-data';
import { getMongoPort } from './environment/worktree-ports.ts';
import { cleanupTestEnvironment, createCommunityUiPortalServer, createStaffUiPortalServer, createTestApiServer, createTestAzuriteServer, createTestOAuth2Server, initTestEnvironment } from './test-server-factories.ts';

const apiDbName = 'owner-community';

const infrastructure = E2EInfrastructure.using({
	authServer: createTestOAuth2Server(),
	azuriteServer: createTestAzuriteServer(),
	browserContextOptions: (state) => {
		const communityBaseUrl = state.uiPortalBaseUrls['community'];
		if (!communityBaseUrl) {
			throw new Error('Community UI portal URL was not initialized');
		}

		return {
			baseURL: communityBaseUrl,
			ignoreHTTPSErrors: true,
		};
	},
	cleanupEnvironment: cleanupTestEnvironment,
	createApiServer: ({ getMongoConnectionString }) => createTestApiServer(getMongoConnectionString),
	mongoServer: {
		dbName: apiDbName,
		port: getMongoPort(),
		replSetName: 'globaldb',
		seedData: seedDatabase,
	},
	setupEnvironment: initTestEnvironment,
})
	.addUiPortal('community', createCommunityUiPortalServer())
	.addUiPortal('staff', createStaffUiPortalServer());

export function getState(): E2EInfrastructureState {
	return infrastructure.getState();
}

export function getUiBaseUrl(site: 'community' | 'staff'): string | undefined {
	return infrastructure.getState().uiPortalBaseUrls[site];
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
