import { describe, expect, it } from 'vitest';
import { checkOComModelExportNaming } from '../checks/data-sources-mongoose-models-conventions.js';

export interface DataSourcesMongooseModelsConventionTestsConfig {
	modelsGlob: string;
	allGlob: string;
}

export function describeDataSourcesMongooseModelsConventionTests(config: DataSourcesMongooseModelsConventionTestsConfig): void {
	describe('OCom Data Sources Mongoose Models Conventions', () => {
		it('model export names must match the model file name', async () => {
			const violations = await checkOComModelExportNaming({
				modelsGlob: config.modelsGlob,
			});
			expect(violations).toStrictEqual([]);
		}, 30000);
	});
}
