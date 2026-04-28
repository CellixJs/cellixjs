export type {
	GraphqlFlatStructureConfig,
	GraphqlResolverConventionsConfig,
} from './checks/graphql-resolver-conventions.js';
export {
	checkGraphqlFlatStructure,
	checkGraphqlResolverContent,
	checkGraphqlResolverDependencies,
} from './checks/graphql-resolver-conventions.js';

export type { GraphqlSchemaConventionsConfig } from './checks/graphql-schema-conventions.js';
export {
	checkGraphqlSchemaConventions,
	checkGraphqlSchemaFileNaming,
	checkGraphqlSchemaInputNaming,
	checkGraphqlSchemaMutationResults,
	checkGraphqlSchemaOrdering,
	checkGraphqlSchemaTypePrefixing,
} from './checks/graphql-schema-conventions.js';

export type {
	GraphqlFlatStructureTestsConfig,
	GraphqlResolverConventionsTestsConfig,
} from './test-suites/graphql-resolver-conventions.js';
export { describeGraphqlResolverConventionsTests } from './test-suites/graphql-resolver-conventions.js';

export type { GraphqlSchemaConventionsTestsConfig } from './test-suites/graphql-schema-conventions.js';
export { describeGraphqlSchemaConventionsTests } from './test-suites/graphql-schema-conventions.js';
