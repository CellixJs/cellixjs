import { ApiInfrastructure } from '@cellix/serenity-framework/infrastructure/api';
import { apiGraphQLTestServer, mongooseTestServer, testMongoServer } from './servers/index.ts';

export const infrastructure = ApiInfrastructure.create()
	.addServer('mongo', testMongoServer)
	.addServer('mongoose', mongooseTestServer, { dependsOn: ['mongo'] })
	.addServer('graphql', apiGraphQLTestServer, { dependsOn: ['mongoose'] })
	.finalize();
