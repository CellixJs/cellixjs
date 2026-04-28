export type { DataSourcesMongooseModelsConventionsConfig } from './checks/data-sources-mongoose-models-conventions.js';
export {
	checkModelBarrelFiles,
	checkModelDependencyBoundaries,
	checkModelFileConventions,
	checkStandaloneModelConventions,
} from './checks/data-sources-mongoose-models-conventions.js';

export type { DataSourcesMongooseModelsConventionTestsConfig } from './test-suites/data-sources-mongoose-models-conventions.js';
export { describeDataSourcesMongooseModelsConventionTests } from './test-suites/data-sources-mongoose-models-conventions.js';
