import { describeGraphqlSchemaConventionsTests, type GraphqlSchemaConventionsTestsConfig } from '@cellix/archunit-tests/graphql';

import { describeGraphqlSchemaConventionsTests as describeOComGraphqlSchemaConventionsTests, type GraphqlSchemaConventionsTestsConfig as OComGraphqlSchemaConventionsTestsConfig } from '@ocom-verification/archunit-tests/graphql';

const cellixSchemaConfig: GraphqlSchemaConventionsTestsConfig = {
	graphqlGlob: '../graphql/src/schema/types/**/*.graphql',
};

const ocomSchemaConfig: OComGraphqlSchemaConventionsTestsConfig = {
	graphqlGlob: '../graphql/src/schema/types/**/*.graphql',
};

describeGraphqlSchemaConventionsTests(cellixSchemaConfig);
describeOComGraphqlSchemaConventionsTests(ocomSchemaConfig);
