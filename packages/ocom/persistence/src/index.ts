import type * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { Models } from '@ocom/data-sources-mongoose-models';
import { DataSourcesFactoryImpl } from './datasources/index.ts';

export type ModelsContext = ReturnType<typeof Models.mongooseContextBuilder>;
export type { DataSources, DataSourcesFactory } from './datasources/index.ts';

export const Persistence = (
	initializedService: MongooseSeedwork.MongooseContextFactory,
) => {
	if (!initializedService?.service) {
		throw new Error('MongooseSeedwork.MongooseContextFactory is required');
	}

	const models: ModelsContext = {
		...Models.mongooseContextBuilder(initializedService),
	};

	return DataSourcesFactoryImpl(models);
};