import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getPropertyReadRepository } from './property.read-repository.ts';

export type { PropertyReadRepository } from './property.read-repository.ts';

export const PropertyReadRepositoryImpl = (models: ModelsContext, passport: Domain.Passport) => {
	return {
		PropertyReadRepo: getPropertyReadRepository(models, passport),
	};
};
