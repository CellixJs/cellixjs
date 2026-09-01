import type { DataSources } from '@ocom/persistence';
import { Property as PropertyApi, type PropertyRequestContext as PropertyApiRequestContext, type PropertyApplicationService } from './property/index.ts';

export interface PropertyContextApplicationService {
	Property: PropertyApplicationService;
}

export const Property = (dataSources: DataSources, requestContext?: PropertyApiRequestContext): PropertyContextApplicationService => {
	return {
		Property: PropertyApi(dataSources, requestContext),
	};
};
