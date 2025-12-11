import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { mongooseContextBuilder } from '@ocom/data-sources-mongoose-models';
import { DataSourcesFactoryImpl } from './datasources/index.ts';
import type { ModelsContext } from './types.ts';

export type { DataSources, DataSourcesFactory } from './datasources/index.ts';

export const Persistence = (
	initializedService: MongooseSeedwork.MongooseContextFactory,
) => {
	if (!initializedService?.service) {
		throw new Error('MongooseSeedwork.MongooseContextFactory is required');
	}

	const models: ModelsContext = {
		...mongooseContextBuilder(initializedService),
	};

	return DataSourcesFactoryImpl(models);
};