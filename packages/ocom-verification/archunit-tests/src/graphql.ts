export {
	checkOComResolversHaveSchemaFiles,
	checkOComSchemaFilesHaveResolvers,
} from './checks/graphql-conventions.js';

export {
	describeGraphqlResolverConventionsTests,
	type GraphqlFlatStructureTestsConfig,
	type GraphqlResolverConventionsTestsConfig,
} from './test-suites/graphql-resolver-conventions.js';

export {
	describeGraphqlSchemaConventionsTests,
	type GraphqlSchemaConventionsTestsConfig,
} from './test-suites/graphql-schema-conventions.js';
