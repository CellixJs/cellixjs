import type { DataSources } from '@ocom/persistence';
import { Property as PropertyApi, type PropertyApplicationService } from './property/index.ts';

export interface PropertyContextApplicationService {
	Property: PropertyApplicationService;
}

export const Property = (dataSources: DataSources): PropertyContextApplicationService => {
	return {
		Property: PropertyApi(dataSources),
	};
};
