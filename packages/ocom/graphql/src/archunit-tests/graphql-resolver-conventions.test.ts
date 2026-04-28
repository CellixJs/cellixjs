import { describeGraphqlResolverConventionsTests, type GraphqlFlatStructureTestsConfig, type GraphqlResolverConventionsTestsConfig } from '@cellix/archunit-tests/graphql';

import {
	describeGraphqlResolverConventionsTests as describeOComGraphqlResolverConventionsTests,
	type GraphqlFlatStructureTestsConfig as OComGraphqlFlatStructureTestsConfig,
	type GraphqlResolverConventionsTestsConfig as OComGraphqlResolverConventionsTestsConfig,
} from '@ocom-verification/archunit-tests/graphql';

const cellixResolverConfig: GraphqlResolverConventionsTestsConfig = {
	resolversGlob: '../graphql/src/schema/types/**',
	entityFilesPattern: '../domain/src/domain/contexts/**/*.entity.ts',
	repositoryFilesPattern: '../domain/src/domain/contexts/**/*.repository.ts',
	uowFilesPattern: '../domain/src/domain/contexts/**/*.uow.ts',
	infrastructureServicesPattern: '../../cellix/service-*/**',
	persistenceFolder: '../persistence/**',
};

const ocomResolverConfig: OComGraphqlResolverConventionsTestsConfig = {
	resolversGlob: '../graphql/src/schema/types/**',
	entityFilesPattern: '../domain/src/domain/contexts/**/*.entity.ts',
	repositoryFilesPattern: '../domain/src/domain/contexts/**/*.repository.ts',
	uowFilesPattern: '../domain/src/domain/contexts/**/*.uow.ts',
	infrastructureServicesPattern: '../../cellix/service-*/**',
	persistenceFolder: '../persistence/**',
};

const cellixFlatStructureConfig: GraphqlFlatStructureTestsConfig = {
	typesDirectoryPath: '../graphql/src/schema/types',
	allowedSubdirectories: ['features'],
};

const ocomFlatStructureConfig: OComGraphqlFlatStructureTestsConfig = {
	typesDirectoryPath: '../graphql/src/schema/types',
	allowedSubdirectories: ['features'],
};

describeGraphqlResolverConventionsTests(cellixResolverConfig, cellixFlatStructureConfig);
describeOComGraphqlResolverConventionsTests(ocomResolverConfig, ocomFlatStructureConfig);
