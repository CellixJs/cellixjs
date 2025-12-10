import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../types.ts';
import { type PropertyReturnType, PropertyPersistence } from './property/index.ts';

export interface PropertyContextPersistence {
	Property: PropertyReturnType;
}

export const PropertyContextPersistence: PersistenceFactory<PropertyContextPersistence> = (models: ModelsContext, passport: Domain.Passport) => ({
	Property: PropertyPersistence(models, passport),
});