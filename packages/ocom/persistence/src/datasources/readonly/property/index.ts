import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { PropertyReadRepositoryImpl } from './property/index.ts';

export const PropertyContext = (models: ModelsContext, passport: Domain.Passport) => ({
	Property: PropertyReadRepositoryImpl(models, passport),
});
