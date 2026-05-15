import { type DataSourcesMongooseModelsConventionTestsConfig, describeDataSourcesMongooseModelsConventionTests } from '@cellix/archunit-tests/data-sources-mongoose-models';
import {
	describeDataSourcesMongooseModelsConventionTests as describeOComDataSourcesMongooseModelsConventionTests,
	type DataSourcesMongooseModelsConventionTestsConfig as OComDataSourcesMongooseModelsConventionTestsConfig,
} from '@ocom-verification/archunit-tests/data-sources-mongoose-models';

const cellixConfig: DataSourcesMongooseModelsConventionTestsConfig = {
	modelsGlob: '../data-sources-mongoose-models/src/models/**',
	allGlob: '../data-sources-mongoose-models/src/**',
};

const ocomConfig: OComDataSourcesMongooseModelsConventionTestsConfig = {
	modelsGlob: '../data-sources-mongoose-models/src/models/**',
	allGlob: '../data-sources-mongoose-models/src/**',
};

describeDataSourcesMongooseModelsConventionTests(cellixConfig);
describeOComDataSourcesMongooseModelsConventionTests(ocomConfig);
