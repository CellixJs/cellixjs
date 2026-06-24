import { E2EInfrastructure } from '@cellix/serenity-framework/infrastructure/e2e';
import { communityUiPortalServer, staffUiPortalServer, testApiServer, testAzuriteServer, testMongoServer, testOAuth2Server } from './servers/index.ts';
import { cleanupTestEnvironment, initTestEnvironment } from './shared/environment/test-environment.ts';

export const infrastructure = E2EInfrastructure.create({
	// baseURL is supplied per portal by the framework; only shared options here.
	browserContextOptions: { ignoreHTTPSErrors: true },
	cleanupEnvironment: cleanupTestEnvironment,
	setupEnvironment: initTestEnvironment,
})
	.addServer('mongo', testMongoServer)
	.addServer('azurite', testAzuriteServer)
	.addServer('auth', testOAuth2Server)
	.addServer('api', testApiServer, { dependsOn: ['mongo', 'azurite', 'auth'] })
	.addUiPortal('community', communityUiPortalServer, { dependsOn: ['api', 'auth'] })
	.addUiPortal('staff', staffUiPortalServer, { dependsOn: ['api', 'auth'] })
	.finalize();
